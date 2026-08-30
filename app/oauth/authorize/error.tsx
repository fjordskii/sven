"use client";

export default function AuthorizeError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
        OAuth
      </p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink">
        Authorization failed
      </h1>
      <p className="mt-5 text-base leading-relaxed text-ink-dim">
        The consent page hit an unexpected error. Reload and try the agent
        request again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 border border-line bg-bg-raised px-4 py-2 text-sm text-ink hover:border-accent hover:text-accent"
      >
        Try again
      </button>
    </div>
  );
}
