import { actorLabel, getActor, type Actor } from "./actor";
import { addDays, dateInZone, isIsoDate, journalTimeZone } from "./dates";
import {
  getStore,
  type JournalStore,
  type StoreDoc,
} from "./journal-store";

export const ITEM_STATUSES = ["in_flight", "done", "next"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export type WorkItem = {
  id: string;
  title: string;
  notes: string;
  status: ItemStatus;
  forDate: string | null;
  sourceAgent: string | null;
  sourcePlatform: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
};

export type PublishItemInput = {
  id?: string;
  title: string;
  notes?: string;
  status?: ItemStatus;
  forDate?: string | null;
  sourceAgent?: string | null;
  sourcePlatform?: string | null;
};

export type UpdateItemInput = {
  id: string;
  title?: string;
  notes?: string;
  status?: ItemStatus;
  forDate?: string | null;
  sourceAgent?: string | null;
  sourcePlatform?: string | null;
};

export type AgendaDay = {
  date: string;
  items: WorkItem[];
};

export type Agenda = {
  today: string;
  todayItems: WorkItem[];
  coming: AgendaDay[];
  unscheduledNext: WorkItem[];
};

const COMING_DAYS = 7;

export function isItemStatus(value: string): value is ItemStatus {
  return (ITEM_STATUSES as readonly string[]).includes(value);
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Title is required.");
  return trimmed.slice(0, 240);
}

function normalizeNotes(notes: string | undefined): string {
  return (notes ?? "").trim();
}

function normalizeDate(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  const trimmed = value.trim();
  if (!isIsoDate(trimmed)) {
    throw new Error("forDate must be YYYY-MM-DD.");
  }
  return trimmed;
}

function normalizeOptional(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 80) : null;
}

function sortItems(items: WorkItem[]): WorkItem[] {
  return [...items].sort((a, b) => {
    if (a.forDate && b.forDate && a.forDate !== b.forDate) {
      return a.forDate < b.forDate ? -1 : 1;
    }
    if (a.forDate && !b.forDate) return -1;
    if (!a.forDate && b.forDate) return 1;
    return a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0;
  });
}

async function mutate(
  store: JournalStore,
  fn: (doc: StoreDoc) => StoreDoc,
): Promise<StoreDoc> {
  return store.update(fn);
}

export async function listItems(
  store: JournalStore = getStore(),
): Promise<WorkItem[]> {
  const doc = await store.load();
  return sortItems(doc.items);
}

export async function getItem(
  id: string,
  store: JournalStore = getStore(),
): Promise<WorkItem | undefined> {
  const doc = await store.load();
  return doc.items.find((item) => item.id === id);
}

export function buildAgenda(
  items: WorkItem[],
  now: Date = new Date(),
  tz: string = journalTimeZone(),
  comingDays: number = COMING_DAYS,
): Agenda {
  const today = dateInZone(now, tz);
  const open = items.filter((item) => item.status !== "done");

  const todayItems = sortItems(
    open.filter((item) => {
      if (item.forDate === today) return true;
      if (item.status === "in_flight" && (!item.forDate || item.forDate <= today)) {
        return true;
      }
      return false;
    }),
  );

  const coming: AgendaDay[] = [];
  for (let offset = 1; offset <= comingDays; offset += 1) {
    const date = addDays(today, offset);
    const dayItems = sortItems(open.filter((item) => item.forDate === date));
    if (dayItems.length > 0) {
      coming.push({ date, items: dayItems });
    }
  }

  const unscheduledNext = sortItems(
    open.filter((item) => item.status === "next" && !item.forDate),
  );

  return { today, todayItems, coming, unscheduledNext };
}

export async function getAgenda(
  store: JournalStore = getStore(),
  now: Date = new Date(),
): Promise<Agenda> {
  return buildAgenda(await listItems(store), now);
}

export async function publishItem(
  input: PublishItemInput,
  store: JournalStore = getStore(),
  actor: Actor = getActor(),
): Promise<WorkItem> {
  const title = normalizeTitle(input.title);
  const notes = normalizeNotes(input.notes);
  const status = input.status ?? "in_flight";
  if (!isItemStatus(status)) throw new Error("Invalid status.");
  const forDate = normalizeDate(input.forDate);
  const sourceAgent =
    normalizeOptional(input.sourceAgent) ??
    (actor.kind === "agent" ? actor.name : "Ford");
  const sourcePlatform =
    normalizeOptional(input.sourcePlatform) ?? actor.platform;
  const stamp = nowIso();

  const doc = await mutate(store, (current) => {
    if (input.id) {
      const index = current.items.findIndex((item) => item.id === input.id);
      if (index === -1) {
        throw new Error(`Item ${input.id} was not found.`);
      }
      const existing = current.items[index];
      const next: WorkItem = {
        ...existing,
        title,
        notes,
        status,
        forDate,
        sourceAgent,
        sourcePlatform,
        updatedAt: stamp,
        updatedBy: actorLabel(actor),
      };
      const items = [...current.items];
      items[index] = next;
      return { ...current, items };
    }

    const created: WorkItem = {
      id: crypto.randomUUID(),
      title,
      notes,
      status,
      forDate,
      sourceAgent,
      sourcePlatform,
      createdAt: stamp,
      updatedAt: stamp,
      updatedBy: actorLabel(actor),
    };
    return { ...current, items: [...current.items, created] };
  });

  const saved = input.id
    ? doc.items.find((item) => item.id === input.id)
    : doc.items[doc.items.length - 1];
  if (!saved) throw new Error("Failed to save item.");
  return saved;
}

export async function updateItem(
  input: UpdateItemInput,
  store: JournalStore = getStore(),
  actor: Actor = getActor(),
): Promise<WorkItem> {
  if (!input.id) throw new Error("id is required.");
  const stamp = nowIso();

  const doc = await mutate(store, (current) => {
    const index = current.items.findIndex((item) => item.id === input.id);
    if (index === -1) {
      throw new Error(`Item ${input.id} was not found.`);
    }
    const existing = current.items[index];
    const next: WorkItem = {
      ...existing,
      title:
        input.title === undefined ? existing.title : normalizeTitle(input.title),
      notes:
        input.notes === undefined ? existing.notes : normalizeNotes(input.notes),
      status:
        input.status === undefined
          ? existing.status
          : isItemStatus(input.status)
            ? input.status
            : (() => {
                throw new Error("Invalid status.");
              })(),
      forDate:
        input.forDate === undefined
          ? existing.forDate
          : normalizeDate(input.forDate),
      sourceAgent:
        input.sourceAgent === undefined
          ? existing.sourceAgent
          : normalizeOptional(input.sourceAgent),
      sourcePlatform:
        input.sourcePlatform === undefined
          ? existing.sourcePlatform
          : normalizeOptional(input.sourcePlatform),
      updatedAt: stamp,
      updatedBy: actorLabel(actor),
    };
    const items = [...current.items];
    items[index] = next;
    return { ...current, items };
  });

  const saved = doc.items.find((item) => item.id === input.id);
  if (!saved) throw new Error("Failed to update item.");
  return saved;
}

export async function markDone(
  id: string,
  store: JournalStore = getStore(),
  actor: Actor = getActor(),
): Promise<WorkItem> {
  return updateItem({ id, status: "done" }, store, actor);
}

export async function addNote(
  id: string,
  note: string,
  store: JournalStore = getStore(),
  actor: Actor = getActor(),
): Promise<WorkItem> {
  const text = note.trim();
  if (!text) throw new Error("Note is required.");
  const stamp = nowIso();
  const heading = `${stamp.slice(0, 16).replace("T", " ")} · ${actorLabel(actor)}`;
  const block = `${heading}\n${text}`;

  const doc = await mutate(store, (current) => {
    const index = current.items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Item ${id} was not found.`);
    }
    const existing = current.items[index];
    const notes = existing.notes.trim()
      ? `${existing.notes.trim()}\n\n${block}`
      : block;
    const items = [...current.items];
    items[index] = {
      ...existing,
      notes,
      updatedAt: stamp,
      updatedBy: actorLabel(actor),
    };
    return { ...current, items };
  });

  const saved = doc.items.find((item) => item.id === id);
  if (!saved) throw new Error("Failed to add note.");
  return saved;
}

export function groupByStatus(items: WorkItem[]): Record<ItemStatus, WorkItem[]> {
  return {
    in_flight: sortItems(items.filter((item) => item.status === "in_flight")),
    next: sortItems(items.filter((item) => item.status === "next")),
    done: sortItems(items.filter((item) => item.status === "done")),
  };
}
