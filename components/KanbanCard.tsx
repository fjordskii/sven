"use client";

import {
  addNoteAction,
  markDoneAction,
  updateItemAction,
} from "@/app/actions/journal";
import { TermButton, statusTone, toneClass } from "@/components/term";
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
      className="border border-line bg-bg p-2.5"
    >
      <h3 className="text-sm text-ink">{item.title}</h3>
      {item.forDate ? (
        <p className="mt-1 text-[13px] text-warn">
          due {formatDay(item.forDate)}
        </p>
      ) : null}
      {item.notes ? (
        <p className="mt-2 whitespace-pre-wrap text-[13px] leading-5 text-ink-dim">
          {item.notes}
        </p>
      ) : null}
      <p className="mt-2 text-[12px] text-ink-dim">
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
          className={`field w-auto ${toneClass[statusTone[item.status]]}`}
        >
          <option value="in_flight">{STATUS_LABEL.in_flight}</option>
          <option value="next">{STATUS_LABEL.next}</option>
          <option value="done">{STATUS_LABEL.done}</option>
        </select>
        <input
          type="date"
          name="forDate"
          defaultValue={item.forDate ?? ""}
          className="field w-auto"
        />
        <TermButton type="submit" tone="accent">
          save
        </TermButton>
      </form>

      {item.status !== "done" ? (
        <form action={markDoneAction} className="mt-1">
          <input type="hidden" name="id" value={item.id} />
          <TermButton type="submit" tone="ok">
            mark done
          </TermButton>
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
          placeholder="add a note"
          className="field min-w-0 flex-1"
        />
        <TermButton type="submit" tone="muted">
          note
        </TermButton>
      </form>
    </article>
  );
}
