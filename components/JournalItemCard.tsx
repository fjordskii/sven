import {
  addNoteAction,
  markDoneAction,
  updateItemAction,
} from "@/app/actions/journal";
import { formatDay, formatStamp } from "@/lib/dates";
import type { ItemStatus, WorkItem } from "@/lib/journal";

const statusLabel: Record<ItemStatus, string> = {
  in_flight: "In flight",
  next: "Next",
  done: "Done",
};

export function JournalItemCard({ item }: { item: WorkItem }) {
  const source = [item.sourceAgent, item.sourcePlatform]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="border-b border-line py-6 last:border-b-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-serif text-2xl tracking-tight text-ink">
          {item.title}
        </h3>
        <p className="font-mono text-xs tracking-wide text-accent uppercase">
          {statusLabel[item.status]}
          {item.forDate ? ` · ${formatDay(item.forDate)}` : ""}
        </p>
      </div>

      {item.notes ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-dim">
          {item.notes}
        </p>
      ) : null}

      <p className="mt-3 text-xs text-ink-dim">
        {source ? <span>{source}</span> : null}
        {source ? <span aria-hidden="true"> · </span> : null}
        Last {item.updatedBy} · {formatStamp(item.updatedAt)}
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <form action={updateItemAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="id" value={item.id} />
          <label className="block text-xs text-ink-dim">
            Status
            <select
              name="status"
              defaultValue={item.status}
              className="mt-1 block border border-line bg-bg-raised px-2 py-1 text-sm text-ink"
            >
              <option value="in_flight">In flight</option>
              <option value="next">Next</option>
              <option value="done">Done</option>
            </select>
          </label>
          <label className="block text-xs text-ink-dim">
            For
            <input
              type="date"
              name="forDate"
              defaultValue={item.forDate ?? ""}
              className="mt-1 block border border-line bg-bg-raised px-2 py-1 text-sm text-ink"
            />
          </label>
          <button
            type="submit"
            className="border border-line px-3 py-1 text-sm text-ink hover:border-accent hover:text-accent"
          >
            Save
          </button>
        </form>

        {item.status !== "done" ? (
          <form action={markDoneAction}>
            <input type="hidden" name="id" value={item.id} />
            <button
              type="submit"
              className="border border-line px-3 py-1 text-sm text-ink-dim hover:border-accent hover:text-accent"
            >
              Mark done
            </button>
          </form>
        ) : null}
      </div>

      <form action={addNoteAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="id" value={item.id} />
        <label className="sr-only" htmlFor={`note-${item.id}`}>
          Add a note to {item.title}
        </label>
        <textarea
          id={`note-${item.id}`}
          name="note"
          rows={2}
          required
          placeholder="Add a note"
          className="min-h-[2.5rem] flex-1 border border-line bg-bg-raised px-2 py-1 text-sm text-ink"
        />
        <button
          type="submit"
          className="self-start border border-line px-3 py-1 text-sm text-ink hover:border-accent hover:text-accent"
        >
          Note
        </button>
      </form>
    </article>
  );
}
