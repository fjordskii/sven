"use client";

import { useState, type DragEvent } from "react";
import { updateItemAction } from "@/app/actions/journal";
import { KanbanCard } from "@/components/KanbanCard";
import { TermFrame, statusTone } from "@/components/term";
import {
  STATUS_LABEL,
  groupByStatus,
  type ItemStatus,
  type WorkItem,
} from "@/lib/journal-model";

const columns: ItemStatus[] = ["in_flight", "next", "done"];

export function KanbanBoard({ items }: { items: WorkItem[] }) {
  const grouped = groupByStatus(items);
  const [over, setOver] = useState<ItemStatus | null>(null);

  async function dropOn(status: ItemStatus, event: DragEvent) {
    event.preventDefault();
    setOver(null);
    const id = event.dataTransfer.getData("text/plain");
    if (!id) return;
    const form = new FormData();
    form.set("id", id);
    form.set("status", status);
    await updateItemAction(form);
  }

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {columns.map((status) => (
        <div
          key={status}
          aria-labelledby={`col-${status}`}
          onDragOver={(event) => {
            event.preventDefault();
            setOver(status);
          }}
          onDragLeave={() => {
            if (over === status) setOver(null);
          }}
          onDrop={(event) => dropOn(status, event)}
        >
          <TermFrame
            tone={statusTone[status]}
            title={
              <>
                {STATUS_LABEL[status].toLowerCase()}
                <span className="ml-2 text-ink-dim">
                  {grouped[status].length}
                </span>
              </>
            }
            className={over === status ? "outline outline-1 outline-accent" : ""}
          >
            <h2 id={`col-${status}`} className="sr-only">
              {STATUS_LABEL[status]}
            </h2>
            <div className="min-h-40 space-y-3">
              {grouped[status].length === 0 ? (
                <p className="text-sm text-ink-dim">empty</p>
              ) : (
                grouped[status].map((item) => (
                  <KanbanCard key={item.id} item={item} />
                ))
              )}
            </div>
          </TermFrame>
        </div>
      ))}
    </div>
  );
}
