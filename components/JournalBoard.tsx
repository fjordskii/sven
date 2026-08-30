import { CalendarStrip } from "@/components/CalendarStrip";
import { KanbanBoard } from "@/components/KanbanBoard";
import { NewItemForm } from "@/components/NewItemForm";
import { formatDay, formatWeekday } from "@/lib/dates";
import type { Agenda, WorkItem } from "@/lib/journal";
import type { StorageStatus } from "@/lib/journal-store";

export function JournalBoard({
  items,
  agenda,
  storage,
}: {
  items: WorkItem[];
  agenda: Agenda;
  storage: StorageStatus;
}) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
        Board · {formatWeekday(agenda.today)} {formatDay(agenda.today)}
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight text-ink sm:text-6xl">
        The desk
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-dim">
        In progress, left to do, and done — plus what is due in the coming
        days. Agents connect over MCP with Google OAuth. You can edit here
        too.
      </p>

      {!storage.ready ? (
        <div className="mt-8 border border-accent bg-bg-raised p-4 text-sm leading-relaxed text-ink">
          <p className="font-medium">Storage is not connected.</p>
          <p className="mt-2 text-ink-dim">
            {storage.message} In the Vercel project: Storage → Create Database
            → Blob → access <strong className="text-ink">Private</strong> →
            connect to Production (and Preview). Then redeploy.
          </p>
        </div>
      ) : null}

      <div className="mt-10">
        <CalendarStrip agenda={agenda} />
      </div>

      <div className="mt-10">
        <KanbanBoard items={items} />
      </div>

      <div className="mt-10 max-w-2xl">
        <NewItemForm />
      </div>
    </div>
  );
}
