import { formatDay, formatWeekday } from "@/lib/dates";
import { STATUS_LABEL, type WorkItem } from "@/lib/journal-model";
import type { Agenda } from "@/lib/journal";

function Line({ item }: { item: WorkItem }) {
  return (
    <li className="py-1.5 text-sm">
      <span className="font-mono text-xs text-accent uppercase">
        {STATUS_LABEL[item.status]}
      </span>
      <span className="mx-2 text-ink-dim" aria-hidden="true">
        ·
      </span>
      <span className="text-ink">{item.title}</span>
    </li>
  );
}

export function CalendarStrip({ agenda }: { agenda: Agenda }) {
  return (
    <section aria-labelledby="calendar" className="border border-line p-4 sm:p-5">
      <h2 id="calendar" className="font-serif text-2xl text-ink">
        Coming days
      </h2>
      <p className="mt-1 text-sm text-ink-dim">
        Due dates plus in-progress work that belongs on today.
      </p>

      <div className="mt-5">
        <p className="font-mono text-xs tracking-wide text-ink-dim">
          Today · {formatWeekday(agenda.today)} {formatDay(agenda.today)}
        </p>
        {agenda.todayItems.length === 0 ? (
          <p className="mt-2 text-sm text-ink-dim">Nothing on the calendar today.</p>
        ) : (
          <ol className="mt-2 divide-y divide-line border-y border-line">
            {agenda.todayItems.map((item) => (
              <Line key={item.id} item={item} />
            ))}
          </ol>
        )}
      </div>

      {agenda.coming.length === 0 && agenda.unscheduledNext.length === 0 ? (
        <p className="mt-5 text-sm text-ink-dim">No dated work in the next week.</p>
      ) : (
        <ol className="mt-5 grid gap-4 sm:grid-cols-2">
          {agenda.coming.map((day) => (
            <li key={day.date} className="border border-line p-3">
              <p className="font-mono text-xs tracking-wide text-ink-dim">
                {formatWeekday(day.date)} {formatDay(day.date)}
              </p>
              <ol className="mt-2">
                {day.items.map((item) => (
                  <Line key={item.id} item={item} />
                ))}
              </ol>
            </li>
          ))}
          {agenda.unscheduledNext.length > 0 ? (
            <li className="border border-line p-3">
              <p className="font-mono text-xs tracking-wide text-ink-dim">
                Unscheduled
              </p>
              <ol className="mt-2">
                {agenda.unscheduledNext.map((item) => (
                  <Line key={item.id} item={item} />
                ))}
              </ol>
            </li>
          ) : null}
        </ol>
      )}
    </section>
  );
}
