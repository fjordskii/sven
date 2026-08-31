"use client";

import { useRef, type KeyboardEvent, type MouseEvent } from "react";
import {
  addNoteAction,
  markDoneAction,
  updateItemAction,
} from "@/app/actions/journal";
import { TermButton, statusTone, toneClass } from "@/components/term";
import { formatDay, formatStamp } from "@/lib/dates";
import { STATUS_LABEL, type WorkItem } from "@/lib/journal-model";

export function KanbanCard({
  item,
  expanded,
  onToggle,
}: {
  item: WorkItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const toggleRef = useRef<HTMLButtonElement>(null);
  const dragging = useRef(false);
  const source = item.sourceAgent || item.sourcePlatform;
  const detailId = `card-detail-${item.id}`;

  function handleToggle(event?: MouseEvent) {
    if (dragging.current) return;
    event?.stopPropagation();
    onToggle();
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Escape" || !expanded) return;
    const target = event.target as HTMLElement | null;
    if (target && target !== event.currentTarget && target.closest("input, select, textarea")) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onToggle();
    toggleRef.current?.focus();
  }

  return (
    <article
      draggable
      onDragStart={(event) => {
        dragging.current = true;
        event.dataTransfer.setData("text/plain", item.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => {
        requestAnimationFrame(() => {
          dragging.current = false;
        });
      }}
      onKeyDown={handleCardKeyDown}
      className={`border border-line bg-bg ${expanded ? "p-2.5" : "px-2.5 py-1.5"}`}
    >
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={expanded}
        aria-controls={expanded ? detailId : undefined}
        onClick={handleToggle}
        className="group flex w-full items-start gap-2 text-left"
      >
        <span
          className={`mt-px shrink-0 leading-5 ${toneClass[statusTone[item.status]]}`}
          aria-hidden="true"
        >
          [{expanded ? "-" : "+"}]
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-ink group-hover:underline">
            {item.title}
          </span>
          {item.forDate || source ? (
            <span className="mt-0.5 block text-[12px] leading-4">
              {item.forDate ? (
                <span className="text-warn">due {formatDay(item.forDate)}</span>
              ) : null}
              {item.forDate && source ? (
                <span className="text-ink-dim"> · </span>
              ) : null}
              {source ? <span className="text-ink-dim">{source}</span> : null}
            </span>
          ) : null}
        </span>
        <span className="sr-only">{expanded ? "Collapse card" : "Expand card"}</span>
      </button>

      {expanded ? (
        <div id={detailId} className="mt-2 border-t border-line pt-2">
          {item.notes ? (
            <p className="whitespace-pre-wrap text-[13px] leading-5 text-ink-dim">
              {item.notes}
            </p>
          ) : (
            <p className="text-[13px] text-ink-dim">no notes</p>
          )}
          <p className="mt-2 text-[12px] text-ink-dim">
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
        </div>
      ) : null}
    </article>
  );
}
