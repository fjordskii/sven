import type { Metadata } from "next";
import { WorkList } from "@/components/WorkList";
import { workByDate } from "@/lib/work";

export const metadata: Metadata = {
  title: "Work",
  description: "A dated log of public work. New entries are added in the repo.",
};

export default function WorkPage() {
  const entries = workByDate();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
        Log
      </p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink sm:text-5xl">
        Work
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-dim">
        Public entries only. Add a new object to{" "}
        <code className="font-mono text-sm text-ink">lib/work.ts</code> when
        something ships.
      </p>
      <div className="mt-10">
        <WorkList entries={entries} />
      </div>
    </div>
  );
}
