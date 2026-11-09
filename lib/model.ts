export const PRODUCTS = [
  "TrackOutline",
  "Deal Score",
  "ARCF",
  "YouTube",
  "dollar",
  "Other",
] as const;
export type Product = (typeof PRODUCTS)[number];

export const PRIORITIES = ["urgent", "normal", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUSES = ["needs_you", "done"] as const;
export type Status = (typeof STATUSES)[number];

export type Note = {
  id: number;
  author: "ford" | "agent";
  body: string;
  created_at: string;
};

export type Item = {
  id: number;
  key: string | null;
  title: string;
  product: Product;
  ask: string;
  why: string;
  priority: Priority;
  status: Status;
  link: string | null;
  opened_at: string;
  updated_at: string;
  resolved_at: string | null;
  notes: Note[];
};

export const PRIORITY_RANK: Record<Priority, number> = {
  urgent: 0,
  normal: 1,
  low: 2,
};

/** Needs-you first, then most urgent, then newest. */
export function sortItems(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    if (a.status !== b.status) return a.status === "needs_you" ? -1 : 1;
    if (a.status === "done") {
      return (b.resolved_at ?? "").localeCompare(a.resolved_at ?? "");
    }
    const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (p !== 0) return p;
    return b.opened_at.localeCompare(a.opened_at);
  });
}

export class ValidationError extends Error {}

const LIMITS = { title: 160, ask: 280, why: 600, link: 600, key: 80, note: 2000 };

function str(
  v: unknown,
  field: keyof typeof LIMITS,
  required: boolean,
): string | undefined {
  if (v === undefined || v === null || v === "") {
    if (required) throw new ValidationError(`${field} is required`);
    return undefined;
  }
  if (typeof v !== "string") throw new ValidationError(`${field} must be a string`);
  const s = v.trim();
  if (required && !s) throw new ValidationError(`${field} is required`);
  if (s.length > LIMITS[field])
    throw new ValidationError(`${field} must be at most ${LIMITS[field]} characters`);
  return s;
}

function oneOf<T extends readonly string[]>(
  v: unknown,
  field: string,
  options: T,
): T[number] | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v !== "string" || !options.includes(v))
    throw new ValidationError(`${field} must be one of: ${options.join(", ")}`);
  return v as T[number];
}

function url(v: unknown): string | null | undefined {
  if (v === null) return null;
  const s = str(v, "link", false);
  if (s === undefined) return undefined;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
  } catch {
    throw new ValidationError("link must be an http(s) URL");
  }
  return s;
}

function date(v: unknown): string | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v !== "string" || Number.isNaN(Date.parse(v)))
    throw new ValidationError("opened_at must be an ISO date");
  return new Date(v).toISOString();
}

export type CreateInput = {
  key?: string;
  title: string;
  product: Product;
  ask: string;
  why: string;
  priority: Priority;
  link?: string | null;
  opened_at?: string;
  note?: string;
};

export function parseCreate(body: unknown): CreateInput {
  if (!body || typeof body !== "object") throw new ValidationError("JSON object body required");
  const b = body as Record<string, unknown>;
  return {
    key: str(b.key, "key", false),
    title: str(b.title, "title", true)!,
    product: oneOf(b.product, "product", PRODUCTS) ?? "Other",
    ask: str(b.ask, "ask", true)!,
    why: str(b.why, "why", false) ?? "",
    priority: oneOf(b.priority, "priority", PRIORITIES) ?? "normal",
    link: url(b.link),
    opened_at: date(b.opened_at),
    note: str(b.note, "note", false),
  };
}

export type UpdateInput = Partial<Omit<CreateInput, "note">> & {
  status?: Status;
  note?: string;
};

export function parseUpdate(body: unknown): UpdateInput {
  if (!body || typeof body !== "object") throw new ValidationError("JSON object body required");
  const b = body as Record<string, unknown>;
  const out: UpdateInput = {};
  if ("key" in b) out.key = str(b.key, "key", false);
  if ("title" in b) out.title = str(b.title, "title", true);
  if ("product" in b) out.product = oneOf(b.product, "product", PRODUCTS);
  if ("ask" in b) out.ask = str(b.ask, "ask", true);
  if ("why" in b) out.why = str(b.why, "why", false) ?? "";
  if ("priority" in b) out.priority = oneOf(b.priority, "priority", PRIORITIES);
  if ("link" in b) out.link = url(b.link) ?? null;
  if ("opened_at" in b) out.opened_at = date(b.opened_at);
  if ("status" in b) out.status = oneOf(b.status, "status", STATUSES);
  if (b.resolve === true) out.status = "done";
  if ("note" in b) out.note = str(b.note, "note", false);
  for (const k of Object.keys(out) as (keyof UpdateInput)[]) {
    if (out[k] === undefined) delete out[k];
  }
  if (Object.keys(out).length === 0) throw new ValidationError("nothing to update");
  return out;
}
