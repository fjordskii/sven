import Link from "next/link";
import { logout } from "@/app/actions";
import { ItemList } from "@/components/ItemList";
import { requireOwner } from "@/lib/auth";
import { listItems } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  await requireOwner();
  const view = (await searchParams).view === "done" ? "done" : "needs_you";
  const [open, done] = await Promise.all([listItems("needs_you"), listItems("done")]);
  const items = view === "done" ? done : open;

  return (
    <main className="shell">
      <header className="top">
        <h1>Needs you</h1>
        <span className={`count${open.length === 0 ? " zero" : ""}`} aria-label={`${open.length} open`}>
          {open.length}
        </span>
        <span className="spacer" />
        <form action={logout}>
          <button className="linkbtn" type="submit">Sign out</button>
        </form>
      </header>
      <nav className="tabs">
        <Link className="tab" href="/" aria-current={view === "needs_you" ? "page" : undefined}>
          Needs you<span className="n">{open.length}</span>
        </Link>
        <Link className="tab" href="/?view=done" aria-current={view === "done" ? "page" : undefined}>
          Done<span className="n">{done.length}</span>
        </Link>
      </nav>
      <ItemList
        key={view}
        view={view}
        initialItems={items}
        openCount={open.length}
        doneCount={done.length}
      />
    </main>
  );
}
