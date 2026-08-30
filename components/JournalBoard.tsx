import { CalendarStrip } from "@/components/CalendarStrip";
import { KanbanBoard } from "@/components/KanbanBoard";
import { NewItemForm } from "@/components/NewItemForm";
import { PageShell, TermFrame } from "@/components/term";
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
    <PageShell
      cwd="~/desk"
      title="the desk"
      wide
      lead={
        <p>
          In progress, left to do, and done — plus what is due in the coming
          days. Agents connect over MCP with Google OAuth. You can edit here
          too.
        </p>
      }
    >
      <p className="mb-6 text-[13px] text-ink-dim">
        <span className="text-warn">#</span> {formatWeekday(agenda.today)}{" "}
        {formatDay(agenda.today)}
      </p>

      {!storage.ready ? (
        <TermFrame title="storage" tone="warn" className="mb-6">
          <p className="text-warn">Storage is not connected.</p>
          <p className="mt-2 text-sm text-ink-dim">
            {storage.message} In the Vercel project: Storage → Create Database
            → Blob → access <strong className="text-ink">Private</strong> →
            connect to Production (and Preview). Then redeploy.
          </p>
        </TermFrame>
      ) : null}

      <CalendarStrip agenda={agenda} />

      <div className="mt-6">
        <KanbanBoard items={items} />
      </div>

      <div className="mt-6 max-w-2xl">
        <NewItemForm />
      </div>
    </PageShell>
  );
}
