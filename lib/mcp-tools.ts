import { z } from "zod";
import { getActor } from "@/lib/actor";
import {
  addNote,
  getAgenda,
  getItem,
  groupByStatus,
  isItemStatus,
  listItems,
  markDone,
  publishItem,
  updateItem,
  type ItemStatus,
} from "@/lib/journal";

const statusSchema = z.enum(["in_flight", "done", "next"]);

export const JOURNAL_INSTRUCTIONS = `You are writing to Ford Heacock's private ops journal on Sven.

Use these tools to keep the board honest:
- When you start work, publish or update an item with status in_flight.
- When you finish work, mark it done (or publish it as done) and leave a short note about what landed.
- When Ford needs to do something, publish a next item with a for_date if you know the day.
- At the start of a session, list the board or get today/upcoming so you do not duplicate work.

Do not invent private emails, AgentMail addresses, or secrets in titles or notes.`;

function jsonResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

function actorDefaults() {
  const actor = getActor();
  return {
    sourceAgent: actor.name,
    sourcePlatform: actor.platform,
  };
}

export const listBoardInput = z.object({
  status: statusSchema.optional(),
});

export const todayUpcomingInput = z.object({
  days: z.number().int().min(1).max(14).optional(),
});

export const publishItemInput = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(240),
  notes: z.string().optional(),
  status: statusSchema.optional(),
  for_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  source_agent: z.string().optional(),
  source_platform: z.string().optional(),
});

export const updateItemInput = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(240).optional(),
  notes: z.string().optional(),
  status: statusSchema.optional(),
  for_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  source_agent: z.string().optional(),
  source_platform: z.string().optional(),
});

export const markDoneInput = z.object({
  id: z.string().min(1),
  note: z.string().optional(),
});

export const addNoteInput = z.object({
  id: z.string().min(1),
  note: z.string().min(1),
});

export async function toolListBoard(args: z.infer<typeof listBoardInput>) {
  const items = await listItems();
  const grouped = groupByStatus(items);
  if (args.status) {
    return jsonResult({
      status: args.status,
      items: grouped[args.status],
      actor: getActor(),
    });
  }
  return jsonResult({
    in_flight: grouped.in_flight,
    next: grouped.next,
    done: grouped.done.slice(0, 20),
    actor: getActor(),
  });
}

export async function toolTodayUpcoming(
  args: z.infer<typeof todayUpcomingInput>,
) {
  const agenda = await getAgenda();
  return jsonResult({
    today: agenda.today,
    today_items: agenda.todayItems,
    coming: args.days
      ? agenda.coming.slice(0, args.days)
      : agenda.coming,
    unscheduled_next: agenda.unscheduledNext,
    actor: getActor(),
  });
}

export async function toolPublishItem(
  args: z.infer<typeof publishItemInput>,
) {
  const defaults = actorDefaults();
  const item = await publishItem({
    id: args.id,
    title: args.title,
    notes: args.notes,
    status: args.status,
    forDate: args.for_date,
    sourceAgent: args.source_agent ?? defaults.sourceAgent,
    sourcePlatform: args.source_platform ?? defaults.sourcePlatform,
  });
  return jsonResult({ item, hint: "Published to Ford's journal." });
}

export async function toolUpdateItem(args: z.infer<typeof updateItemInput>) {
  const item = await updateItem({
    id: args.id,
    title: args.title,
    notes: args.notes,
    status: args.status,
    forDate: args.for_date,
    sourceAgent: args.source_agent,
    sourcePlatform: args.source_platform,
  });
  return jsonResult({ item });
}

export async function toolMarkDone(args: z.infer<typeof markDoneInput>) {
  if (args.note) {
    await addNote(args.id, args.note);
  }
  const item = await markDone(args.id);
  return jsonResult({ item });
}

export async function toolAddNote(args: z.infer<typeof addNoteInput>) {
  const existing = await getItem(args.id);
  if (!existing) throw new Error(`Item ${args.id} was not found.`);
  const item = await addNote(args.id, args.note);
  return jsonResult({ item });
}

export function asToolError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return errorResult(message);
}

export { isItemStatus };
export type { ItemStatus };
