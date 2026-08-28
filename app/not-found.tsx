import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <p className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
        404
      </p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink">
        Not on the log
      </h1>
      <p className="mt-4 max-w-md text-ink-dim">
        That page is not here. The work list is.
      </p>
      <p className="mt-8 text-sm">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>
        <span aria-hidden="true"> · </span>
        <Link href="/work" className="hover:text-accent">
          Work
        </Link>
      </p>
    </div>
  );
}
