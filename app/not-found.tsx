import Link from "next/link";
import { PageShell } from "@/components/term";

export default function NotFound() {
  return (
    <PageShell
      cwd="~/404"
      title="not on the log"
      lead={<p>That page is not here. The work list is.</p>}
    >
      <p className="text-sm">
        <Link href="/" className="text-accent hover:text-ink">
          board
        </Link>
        <span className="text-ink-dim" aria-hidden="true">
          {"  "}·{"  "}
        </span>
        <Link href="/work" className="text-accent hover:text-ink">
          work
        </Link>
      </p>
    </PageShell>
  );
}
