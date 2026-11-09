import "server-only";
import { neon } from "@neondatabase/serverless";
import type { CreateInput, Item, Note, UpdateInput } from "@/lib/model";
import { sortItems } from "@/lib/model";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  schemaReady ??= (async () => {
    const q = sql();
    await q`CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      key TEXT UNIQUE,
      title TEXT NOT NULL,
      product TEXT NOT NULL,
      ask TEXT NOT NULL,
      why TEXT NOT NULL DEFAULT '',
      priority TEXT NOT NULL DEFAULT 'normal',
      status TEXT NOT NULL DEFAULT 'needs_you',
      link TEXT,
      opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      resolved_at TIMESTAMPTZ
    )`;
    await q`CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      author TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    await q`CREATE INDEX IF NOT EXISTS notes_item_idx ON notes(item_id)`;
  })().catch((e) => {
    schemaReady = null;
    throw e;
  });
  return schemaReady;
}

type Row = Record<string, unknown>;

function iso(v: unknown): string {
  return v instanceof Date ? v.toISOString() : String(v);
}

function toItem(r: Row, notes: Note[]): Item {
  return {
    id: Number(r.id),
    key: (r.key as string | null) ?? null,
    title: r.title as string,
    product: r.product as Item["product"],
    ask: r.ask as string,
    why: r.why as string,
    priority: r.priority as Item["priority"],
    status: r.status as Item["status"],
    link: (r.link as string | null) ?? null,
    opened_at: iso(r.opened_at),
    updated_at: iso(r.updated_at),
    resolved_at: r.resolved_at ? iso(r.resolved_at) : null,
    notes,
  };
}

async function attachNotes(rows: Row[]): Promise<Item[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => Number(r.id));
  const noteRows = (await sql()`
    SELECT id, item_id, author, body, created_at FROM notes
    WHERE item_id = ANY(${ids}) ORDER BY created_at ASC, id ASC`) as Row[];
  const byItem = new Map<number, Note[]>();
  for (const n of noteRows) {
    const list = byItem.get(Number(n.item_id)) ?? [];
    list.push({
      id: Number(n.id),
      author: n.author as Note["author"],
      body: n.body as string,
      created_at: iso(n.created_at),
    });
    byItem.set(Number(n.item_id), list);
  }
  return rows.map((r) => toItem(r, byItem.get(Number(r.id)) ?? []));
}

export async function listItems(status: "needs_you" | "done" | "all"): Promise<Item[]> {
  await ensureSchema();
  const q = sql();
  const rows = (status === "all"
    ? await q`SELECT * FROM items`
    : await q`SELECT * FROM items WHERE status = ${status}`) as Row[];
  return sortItems(await attachNotes(rows));
}

export async function countNeedsYou(): Promise<number> {
  await ensureSchema();
  const rows = (await sql()`SELECT count(*)::int AS n FROM items WHERE status = 'needs_you'`) as Row[];
  return Number(rows[0]?.n ?? 0);
}

export async function getItem(id: number): Promise<Item | null> {
  await ensureSchema();
  const rows = (await sql()`SELECT * FROM items WHERE id = ${id}`) as Row[];
  const [item] = await attachNotes(rows);
  return item ?? null;
}

export async function addNote(id: number, author: Note["author"], body: string): Promise<void> {
  await ensureSchema();
  await sql()`INSERT INTO notes (item_id, author, body) VALUES (${id}, ${author}, ${body})`;
  await sql()`UPDATE items SET updated_at = now() WHERE id = ${id}`;
}

/** Creates an item. If `key` matches an existing item, returns that one instead. */
export async function createItem(
  input: CreateInput,
): Promise<{ item: Item; created: boolean }> {
  await ensureSchema();
  const q = sql();
  if (input.key) {
    const existing = (await q`SELECT id FROM items WHERE key = ${input.key}`) as Row[];
    if (existing[0]) return { item: (await getItem(Number(existing[0].id)))!, created: false };
  }
  const rows = (await q`
    INSERT INTO items (key, title, product, ask, why, priority, link, opened_at)
    VALUES (${input.key ?? null}, ${input.title}, ${input.product}, ${input.ask},
            ${input.why}, ${input.priority}, ${input.link ?? null},
            COALESCE(${input.opened_at ?? null}::timestamptz, now()))
    RETURNING id`) as Row[];
  const id = Number(rows[0].id);
  if (input.note) await addNote(id, "agent", input.note);
  return { item: (await getItem(id))!, created: true };
}

export async function updateItem(
  id: number,
  input: UpdateInput,
  author: Note["author"],
): Promise<Item | null> {
  await ensureSchema();
  const current = await getItem(id);
  if (!current) return null;
  const next = { ...current, ...input };
  const resolvedAt =
    next.status === "done"
      ? (current.resolved_at ?? new Date().toISOString())
      : null;
  await sql()`
    UPDATE items SET
      key = ${next.key}, title = ${next.title}, product = ${next.product},
      ask = ${next.ask}, why = ${next.why}, priority = ${next.priority},
      link = ${next.link}, opened_at = ${next.opened_at}::timestamptz,
      status = ${next.status}, resolved_at = ${resolvedAt}::timestamptz,
      updated_at = now()
    WHERE id = ${id}`;
  if (input.note) await addNote(id, author, input.note);
  return getItem(id);
}
