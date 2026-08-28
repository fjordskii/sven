import Link from "next/link";
import { formatDate, type WorkEntry } from "@/lib/work";

export function WorkList({ entries }: { entries: WorkEntry[] }) {
  return (
    <ol className="divide-y divide-line border-y border-line">
      {entries.map((entry) => (
        <li key={entry.slug}>
          <Link
            href={`/work/${entry.slug}`}
            className="group grid gap-1 py-5 no-underline sm:grid-cols-[7.5rem_1fr] sm:gap-6"
          >
            <time
              dateTime={entry.date}
              className="font-mono text-xs tracking-wide text-ink-dim sm:pt-1"
            >
              {formatDate(entry.date)}
            </time>
            <span>
              <span className="block font-serif text-xl text-ink group-hover:text-accent">
                {entry.title}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-ink-dim">
                {entry.summary}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
