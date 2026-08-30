"use client";

import { useState } from "react";
import { createTokenAction, revokeTokenAction } from "@/app/actions/tokens";
import { formatStamp } from "@/lib/dates";
import type { AgentTokenPublic } from "@/lib/agent-tokens";

export function AgentTokens({ tokens }: { tokens: AgentTokenPublic[] }) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onCreate(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      const created = await createTokenAction(
        String(formData.get("name") ?? ""),
        String(formData.get("platform") ?? ""),
      );
      setRevealed(created.token);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create token.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="agent-access" className="border-t border-line pt-12">
      <p className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
        Agent access
      </p>
      <h2
        id="agent-access"
        className="mt-3 font-serif text-3xl tracking-tight text-ink"
      >
        Tokens for the desk
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-dim">
        Mint a bearer token for Cursor, ChatGPT, Claude, Grok, or a cloud agent.
        The secret is shown once. Agents use it at{" "}
        <code className="font-mono text-ink">/mcp</code> — they do not sign in
        with Google.
      </p>

      <form action={onCreate} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="block flex-1 text-sm text-ink-dim">
          Name
          <input
            name="name"
            required
            placeholder="Cursor Cloud"
            className="mt-1 w-full border border-line bg-bg-raised px-3 py-2 text-ink"
          />
        </label>
        <label className="block flex-1 text-sm text-ink-dim">
          Platform
          <input
            name="platform"
            placeholder="cursor"
            className="mt-1 w-full border border-line bg-bg-raised px-3 py-2 text-ink"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="self-end border border-line px-4 py-2 text-sm text-ink hover:border-accent hover:text-accent disabled:opacity-60"
        >
          {pending ? "Minting…" : "Mint token"}
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}

      {revealed ? (
        <div className="mt-6 border border-accent bg-bg-raised p-4">
          <p className="text-sm text-ink">
            Copy this now. It will not be shown again.
          </p>
          <code className="mt-3 block break-all font-mono text-sm text-accent">
            {revealed}
          </code>
          <button
            type="button"
            className="mt-3 text-sm text-ink-dim hover:text-ink"
            onClick={() => setRevealed(null)}
          >
            Hide
          </button>
        </div>
      ) : null}

      {tokens.length === 0 ? (
        <p className="mt-8 text-sm text-ink-dim">No active agent tokens.</p>
      ) : (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {tokens.map((token) => (
            <li
              key={token.id}
              className="flex flex-wrap items-baseline justify-between gap-3 py-4"
            >
              <div>
                <p className="text-ink">{token.name}</p>
                <p className="mt-1 font-mono text-xs text-ink-dim">
                  {token.prefix}…{token.platform ? ` · ${token.platform}` : ""}
                  {" · "}
                  created {formatStamp(token.createdAt)}
                  {token.lastUsedAt
                    ? ` · last used ${formatStamp(token.lastUsedAt)}`
                    : ""}
                </p>
              </div>
              <form
                action={async () => {
                  await revokeTokenAction(token.id);
                }}
              >
                <button
                  type="submit"
                  className="text-sm text-ink-dim hover:text-accent"
                >
                  Revoke
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
