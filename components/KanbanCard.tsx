"use client";

import {
  addNoteAction,
  markDoneAction,
  updateItemAction,
} from "@/app/actions/journal";
import { formatDay, formatStamp } from "@/lib/dates";
import { STATUS_LABEL, type WorkItem } from "@/lib/journal-model";

export function KanbanCard({ item }: { item: WorkItem }) {
  const source = [item.sourceAgent, item.sourcePlatform]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", item.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      className="border border-line bg-bg p-3"
    >
      <h3 className="font-serif text-lg tracking-tight text-ink">{item.title}</h3>
      {item.forDate ? (
        <p className="mt-1 font-mono text-xs text-accent">
          Due {formatDay(item.forDate)}
        </p>
      ) : null}
      {item.notes ? (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-dim">
          {item.notes}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-ink-dim">
        {source ? `${source} · ` : ""}
        {item.updatedBy} · {formatStamp(item.updatedAt)}
      </p>

      <form action={updateItemAction} className="mt-3 flex flex-wrap gap-2">
        <input type="hidden" name="id" value={item.id} />
        <label className="sr-only" htmlFor={`status-${item.id}`}>
          Status
        </label>
        <select
          id={`status-${item.id}`}
          name="status"
          defaultValue={item.status}
          className="border border-line bg-bg-raised px-2 py-1 text-xs text-ink"
        >
          <option value="in_flight">{STATUS_LABEL.in_flight}</option>
          <option value="next">{STATUS_LABEL.next}</option>
          <option value="done">{STATUS_LABEL.done}</option>
        </select>
        <input
          type="date"
          name="forDate"
          defaultValue={item.forDate ?? ""}
          className="border border-line bg-bg-raised px-2 py-1 text-xs text-ink"
        />
        <button
          type="submit"
          className="border border-line px-2 py-1 text-xs text-ink hover:border-accent hover:text-accent"
        >
          Save
        </button>
      </form>

      {item.status !== "done" ? (
        <form action={markDoneAction} className="mt-2">
          <input type="hidden" name="id" value={item.id} />
          <button type="submit" className="text-xs text-ink-dim hover:text-accent">
            Mark done
          </button>
        </form>
      ) : null}

      <form action={addNoteAction} className="mt-2 flex gap-2">
        <input type="hidden" name="id" value={item.id} />
        <label className="sr-only" htmlFor={`note-${item.id}`}>
          Note
        </label>
        <input
          id={`note-${item.id}`}
          name="note"
          required
          placeholder="Add a note"
          className="min-w-0 flex-1 border border-line bg-bg-raised px-2 py-1 text-xs text-ink"
        />
        <button
          type="submit"
          className="border border-line px-2 py-1 text-xs text-ink hover:border-accent"
        >
          Note
        </button>
      </form>
    </article>
  );
}
