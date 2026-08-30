import { AgentTokens } from "@/components/AgentTokens";
import { JournalItemCard } from "@/components/JournalItemCard";
import { NewItemForm } from "@/components/NewItemForm";
import { formatDay, formatWeekday } from "@/lib/dates";
import type { AgentTokenPublic } from "@/lib/agent-tokens";
import type { Agenda, WorkItem } from "@/lib/journal";
import { groupByStatus } from "@/lib/journal";
import type { StorageStatus } from "@/lib/journal-store";

function AgendaLine({ item }: { item: WorkItem }) {
  const source = [item.sourceAgent, item.sourcePlatform]
    .filter(Boolean)
    .join(" · ");
  return (
    <li className="py-2">
      <p className="text-ink">
        <span className="font-mono text-xs tracking-wide text-accent uppercase">
          {item.status === "in_flight" ? "In flight" : "Next"}
        </span>
        <span className="mx-2 text-ink-dim" aria-hidden="true">
          ·
        </span>
        {item.title}
      </p>
      {source ? (
        <p className="mt-1 text-xs text-ink-dim">{source}</p>
      ) : null}
    </li>
  );
}

export function JournalBoard({
  items,
  agenda,
  tokens,
  storage,
}: {
  items: WorkItem[];
  agenda: Agenda;
  tokens: AgentTokenPublic[];
  storage: StorageStatus;
}) {
  const grouped = groupByStatus(items);

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
        Desk · {formatWeekday(agenda.today)} {formatDay(agenda.today)}
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight text-ink sm:text-6xl">
        The journal
      </h1>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-dim">
        What is in flight, what landed, and what Ford should do today and in
        the coming days. Agents publish here. This page is the desk, not a
        marketing site.
      </p>

      {!storage.ready ? (
        <div className="mt-8 border border-accent bg-bg-raised p-4 text-sm leading-relaxed text-ink">
          <p className="font-medium">Storage is not connected.</p>
          <p className="mt-2 text-ink-dim">
            {storage.message} In the Vercel project: Storage → Create Database
            → Blob → access{" "}
            <strong className="text-ink">Private</strong> → connect to
            Production (and Preview). Then redeploy.
          </p>
        </div>
      ) : null}

      <section className="mt-12 border-t border-line pt-10" aria-labelledby="today">
        <h2 id="today" className="font-serif text-3xl text-ink">
          Today
        </h2>
        {agenda.todayItems.length === 0 ? (
          <p className="mt-4 text-sm text-ink-dim">
            Nothing dated today, and no in-flight work waiting. Add a next item
            or let an agent publish one.
          </p>
        ) : (
          <ol className="mt-4 divide-y divide-line border-y border-line">
            {agenda.todayItems.map((item) => (
              <AgendaLine key={item.id} item={item} />
            ))}
          </ol>
        )}
      </section>

      <section className="mt-10" aria-labelledby="coming">
        <h2 id="coming" className="font-serif text-3xl text-ink">
          Coming days
        </h2>
        {agenda.coming.length === 0 && agenda.unscheduledNext.length === 0 ? (
          <p className="mt-4 text-sm text-ink-dim">
            No dated work in the next week.
          </p>
        ) : (
          <ol className="mt-4 space-y-5">
            {agenda.coming.map((day) => (
              <li key={day.date}>
                <p className="font-mono text-xs tracking-wide text-ink-dim">
                  {formatWeekday(day.date)} {formatDay(day.date)}
                </p>
                <ol className="mt-2 divide-y divide-line border-y border-line">
                  {day.items.map((item) => (
                    <AgendaLine key={item.id} item={item} />
                  ))}
                </ol>
              </li>
            ))}
            {agenda.unscheduledNext.length > 0 ? (
              <li>
                <p className="font-mono text-xs tracking-wide text-ink-dim">
                  Unscheduled next
                </p>
                <ol className="mt-2 divide-y divide-line border-y border-line">
                  {agenda.unscheduledNext.map((item) => (
                    <AgendaLine key={item.id} item={item} />
                  ))}
                </ol>
              </li>
            ) : null}
          </ol>
        )}
      </section>

      <div className="mt-12">
        <NewItemForm />
      </div>

      <section className="mt-14" aria-labelledby="in-flight">
        <h2 id="in-flight" className="font-serif text-3xl text-ink">
          In flight
        </h2>
        {grouped.in_flight.length === 0 ? (
          <p className="mt-4 text-sm text-ink-dim">
            No live work. When an agent starts something, it should land here.
          </p>
        ) : (
          <div className="mt-2">
            {grouped.in_flight.map((item) => (
              <JournalItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12" aria-labelledby="next-work">
        <h2 id="next-work" className="font-serif text-3xl text-ink">
          Next
        </h2>
        {grouped.next.length === 0 ? (
          <p className="mt-4 text-sm text-ink-dim">
            The queue is empty. That is either peace or a gap.
          </p>
        ) : (
          <div className="mt-2">
            {grouped.next.map((item) => (
              <JournalItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12" aria-labelledby="done-work">
        <h2 id="done-work" className="font-serif text-3xl text-ink">
          Done
        </h2>
        {grouped.done.length === 0 ? (
          <p className="mt-4 text-sm text-ink-dim">Nothing marked done yet.</p>
        ) : (
          <div className="mt-2">
            {grouped.done.map((item) => (
              <JournalItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <div className="mt-16">
        <AgentTokens tokens={tokens} />
      </div>
    </div>
  );
}
