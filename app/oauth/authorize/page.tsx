import { decideAuthorization } from "@/app/oauth/authorize/actions";
import { isAllowedRedirectUri, redirectUrisMatch } from "@/lib/oauth";
import { resolveClient } from "@/lib/oauth-grant";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Authorize agent",
  description: "Approve an MCP client to publish to the journal.",
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AuthorizePage({
  searchParams,
}: PageProps<"/oauth/authorize">) {
  const params = await searchParams;
  const clientId = first(params.client_id);
  const redirectUri = first(params.redirect_uri);
  const state = first(params.state);
  const challenge = first(params.code_challenge);
  const method = first(params.code_challenge_method) || "S256";
  const responseType = first(params.response_type);
  const resource = first(params.resource);
  const scope = first(params.scope);

  if (responseType && responseType !== "code") {
    return (
      <ErrorBox title="Unsupported response type" detail="This server only issues authorization codes." />
    );
  }
  if (!clientId || !redirectUri || !challenge) {
    return (
      <ErrorBox
        title="Incomplete authorization request"
        detail="The client must send client_id, redirect_uri, and a PKCE code_challenge."
      />
    );
  }
  if (method !== "S256") {
    return (
      <ErrorBox title="PKCE required" detail="code_challenge_method must be S256." />
    );
  }

  const client = await resolveClient(clientId);
  if (!client) {
    return (
      <ErrorBox
        title="Unknown client"
        detail="Register via Dynamic Client Registration or present a Client ID Metadata Document URL."
      />
    );
  }
  if (!isAllowedRedirectUri(redirectUri) || !redirectUrisMatch(client.redirect_uris, redirectUri)) {
    return (
      <ErrorBox
        title="Redirect URI is not allowed"
        detail="The redirect_uri is not registered for this client."
      />
    );
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
        <strong className="text-ink">{client.client_name}</strong> wants to
        read and update the journal. You are signing this grant with the same
        Google account that owns the site. After you approve, the client
        receives an access token — you do not paste a secret.
      </p>
      <dl className="mt-8 space-y-3 text-sm text-ink-dim">
        <div>
          <dt className="font-mono text-xs tracking-wide uppercase">Client</dt>
          <dd className="mt-1 text-ink">{client.client_name}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs tracking-wide uppercase">Redirect</dt>
          <dd className="mt-1 break-all text-ink">{redirectUri}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs tracking-wide uppercase">Scope</dt>
          <dd className="mt-1 text-ink">{scope || "journal"}</dd>
        </div>
      </dl>

      <form action={decideAuthorization} className="mt-10 flex flex-wrap gap-3">
        <input type="hidden" name="client_id" value={clientId} />
        <input type="hidden" name="redirect_uri" value={redirectUri} />
        <input type="hidden" name="state" value={state} />
        <input type="hidden" name="code_challenge" value={challenge} />
        <input type="hidden" name="resource" value={resource} />
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
