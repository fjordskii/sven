"use client";

import { useState, type DragEvent } from "react";
import { updateItemAction } from "@/app/actions/journal";
import { KanbanCard } from "@/components/KanbanCard";
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
    <div className="grid gap-4 lg:grid-cols-3">
      {columns.map((status) => (
        <section
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
          className={`min-h-48 border border-line bg-bg-raised p-3 ${
            over === status ? "border-accent" : ""
          }`}
        >
          <h2
            id={`col-${status}`}
            className="font-mono text-xs tracking-[0.18em] text-accent uppercase"
          >
            {STATUS_LABEL[status]}
            <span className="ml-2 text-ink-dim">{grouped[status].length}</span>
          </h2>
          <div className="mt-3 space-y-3">
            {grouped[status].length === 0 ? (
              <p className="text-sm text-ink-dim">Empty.</p>
            ) : (
              grouped[status].map((item) => (
                <KanbanCard key={item.id} item={item} />
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
