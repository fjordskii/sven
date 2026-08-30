"use client";

import { TermButton } from "@/components/term";

export default function AuthorizeError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <p className="text-[13px] leading-6 text-ink-dim">
        <span className="text-ok">sven</span>@
        <span className="text-accent">ops</span>:
        <span className="text-purple">~/oauth</span>
      </p>
      <h1 className="mt-1 text-xl text-ink sm:text-2xl">
        authorization failed
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-dim">
        The consent page hit an unexpected error. Reload and try the agent
        request again.
      </p>
      <div className="mt-6">
        <TermButton type="button" onClick={reset} tone="accent">
          try again
        </TermButton>
      </div>
    </div>
  );
}
