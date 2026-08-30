import { TermFrame, statusTone, toneClass } from "@/components/term";
import { addDays, formatDay, formatWeekday } from "@/lib/dates";
import { STATUS_LABEL, type WorkItem } from "@/lib/journal-model";
import type { Agenda } from "@/lib/journal";

function Line({ item }: { item: WorkItem }) {
  return (
    <li className="py-0.5 text-[13px] leading-5">
      <span className={toneClass[statusTone[item.status]]}>
        [{STATUS_LABEL[item.status].toLowerCase()}]
      </span>{" "}
      <span className="text-ink">{item.title}</span>
    </li>
  );
}

export function CalendarStrip({ agenda }: { agenda: Agenda }) {
  const week = Array.from({ length: 7 }, (_, offset) => {
    const date = addDays(agenda.today, offset);
    const items =
      offset === 0
        ? agenda.todayItems
        : (agenda.coming.find((day) => day.date === date)?.items ?? []);
    return { date, items, isToday: offset === 0 };
  });

  return (
    <TermFrame title="calendar" tone="warn">
      <h2 id="calendar" className="sr-only">
        Coming days
      </h2>
      <p className="mb-3 text-[13px] text-ink-dim">
        due dates plus in-progress work that belongs on today
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {week.map((day) => (
          <div key={day.date} className="min-w-0">
            <p
              className={`text-[13px] ${day.isToday ? "text-warn" : "text-ink-dim"}`}
            >
              {day.isToday ? "today · " : ""}
              {formatWeekday(day.date)} {formatDay(day.date)}
            </p>
            {day.items.length === 0 ? (
              <p className="mt-1 text-[13px] text-ink-dim">.</p>
            ) : (
              <ol className="mt-1">
                {day.items.map((item) => (
                  <Line key={item.id} item={item} />
                ))}
              </ol>
            )}
          </div>
        ))}
        {agenda.unscheduledNext.length > 0 ? (
          <div className="min-w-0">
            <p className="text-[13px] text-purple">unscheduled</p>
            <ol className="mt-1">
              {agenda.unscheduledNext.map((item) => (
                <Line key={item.id} item={item} />
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </TermFrame>
  );
}
