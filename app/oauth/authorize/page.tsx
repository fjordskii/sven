import { decideAuthorization } from "@/app/oauth/authorize/actions";
import { loadAuthorizationRequest } from "@/lib/oauth-authorize";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Authorize agent",
  description: "Approve an MCP client to publish to the journal.",
};

export default async function AuthorizePage({
  searchParams,
}: PageProps<"/oauth/authorize">) {
  const params = await searchParams;
  const view = await loadAuthorizationRequest(params);

  if (!view.ok) {
    return <ErrorBox title={view.title} detail={view.detail} />;
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
        MCP OAuth
      </p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink">
        Let this agent onto the board?
      </h1>
      <p className="mt-5 text-base leading-relaxed text-ink-dim">
        <strong className="text-ink">{view.client.client_name}</strong> wants to
        read and update the journal. You are signing this grant with the same
        Google account that owns the site. After you approve, the client
        receives an access token — you do not paste a secret.
      </p>
      <dl className="mt-8 space-y-3 text-sm text-ink-dim">
        <div>
          <dt className="font-mono text-xs tracking-wide uppercase">Client</dt>
          <dd className="mt-1 text-ink">{view.client.client_name}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs tracking-wide uppercase">Redirect</dt>
          <dd className="mt-1 break-all text-ink">{view.redirectUri}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs tracking-wide uppercase">Scope</dt>
          <dd className="mt-1 text-ink">{view.scope || "journal"}</dd>
        </div>
      </dl>

      <form action={decideAuthorization} className="mt-10 flex flex-wrap gap-3">
        <input type="hidden" name="client_id" value={view.clientId} />
        <input type="hidden" name="redirect_uri" value={view.redirectUri} />
        <input type="hidden" name="state" value={view.state} />
        <input type="hidden" name="code_challenge" value={view.challenge} />
        <input type="hidden" name="resource" value={view.resource} />
        <button
          type="submit"
          name="decision"
          value="approve"
          className="border border-line bg-bg-raised px-4 py-2 text-sm text-ink hover:border-accent hover:text-accent"
        >
          Approve
        </button>
        <button
          type="submit"
          name="decision"
          value="deny"
          className="px-4 py-2 text-sm text-ink-dim hover:text-ink"
        >
          Deny
        </button>
      </form>
    </div>
  );
}

function ErrorBox({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="mx-auto max-w-xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
        OAuth
      </p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink">{title}</h1>
      <p className="mt-5 text-base leading-relaxed text-ink-dim">{detail}</p>
    </div>
  );
}
