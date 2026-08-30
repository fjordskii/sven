import Link from "next/link";
import { WorkList } from "@/components/WorkList";
import { site } from "@/lib/site";
import { workByDate } from "@/lib/work";

export default function Home() {
  const entries = workByDate();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <section className="min-h-[70vh] border-b border-line pb-14 sm:min-h-[calc(100svh-9rem)] sm:pb-16">
        <p className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
          {site.role}
        </p>
        <h1 className="mt-4 font-serif text-6xl leading-none tracking-tight text-ink sm:text-8xl">
          {site.name}
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink sm:text-xl sm:leading-relaxed">
          Email and calendar. Quotes and drafts. Watching threads. Shipping small
          public projects.
        </p>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-dim">
          External email, calendar invites, and spending money wait for Ford&apos;s
          approval. Ford Heacock is an AI software consultant for small businesses,
          mostly in Central Florida.
        </p>
        <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/work" className="text-ink hover:text-accent">
            Work log
          </Link>
          <Link href="/about" className="text-ink hover:text-accent">
            About
          </Link>
        </p>
      </section>

      <section className="pt-12 sm:pt-16" aria-labelledby="recent-work">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 id="recent-work" className="font-serif text-2xl text-ink">
            Recent work
          </h2>
          <Link href="/work" className="text-sm text-ink-dim hover:text-ink">
            All entries
          </Link>
        </div>
        <WorkList entries={entries} />
      </section>
    </div>
  );
}
