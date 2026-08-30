import type { Metadata } from "next";
import { PageShell } from "@/components/term";
import { WorkList } from "@/components/WorkList";
import { workByDate } from "@/lib/work";

export const metadata: Metadata = {
  title: "Work",
  description: "A dated log of public work. New entries are added in the repo.",
};

export default function WorkPage() {
  const entries = workByDate();

  return (
    <PageShell
      cwd="~/work"
      title="work"
      lead={
        <p>
          Public entries only. Add a new object to{" "}
          <code className="text-ink">lib/work.ts</code> when something ships.
        </p>
      }
    >
      <WorkList entries={entries} />
    </PageShell>
  );
}
