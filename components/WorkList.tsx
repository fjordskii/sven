import Link from "next/link";
import { formatDate, type WorkEntry } from "@/lib/work";

export function WorkList({ entries }: { entries: WorkEntry[] }) {
  return (
    <ol>
      {entries.map((entry) => (
        <li key={entry.slug} className="border-t border-line py-4 first:border-t-0">
          <Link
            href={`/work/${entry.slug}`}
            className="group grid gap-1 no-underline sm:grid-cols-[8rem_1fr] sm:gap-6"
          >
            <time
              dateTime={entry.date}
              className="text-[13px] text-ink-dim sm:pt-0.5"
            >
              {formatDate(entry.date)}
            </time>
            <span>
              <span className="block text-ink group-hover:text-accent">
                {entry.title}
              </span>
              <span className="mt-1 block text-[13px] leading-6 text-ink-dim">
                {entry.summary}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
