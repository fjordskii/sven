import { decideAuthorization } from "@/app/oauth/authorize/actions";
import { PageShell, TermButton, TermFrame } from "@/components/term";
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
    <PageShell
      cwd="~/oauth"
      title="let this agent onto the board?"
      lead={
        <p>
          <strong className="font-medium text-ink">{view.client.client_name}</strong>{" "}
          wants to read and update the journal. You are signing this grant with
          the same Google account that owns the site. After you approve, the
          client receives an access token — you do not paste a secret.
        </p>
      }
    >
      <TermFrame title="grant" tone="accent">
        <dl className="space-y-3 text-[13px] text-ink-dim">
          <div>
            <dt className="text-ink-dim">client</dt>
            <dd className="mt-0.5 text-ink">{view.client.client_name}</dd>
          </div>
          <div>
            <dt className="text-ink-dim">redirect</dt>
            <dd className="mt-0.5 break-all text-ink">{view.redirectUri}</dd>
          </div>
          <div>
            <dt className="text-ink-dim">scope</dt>
            <dd className="mt-0.5 text-ink">{view.scope || "journal"}</dd>
          </div>
        </dl>
      </TermFrame>

      <form action={decideAuthorization} className="mt-6 flex flex-wrap gap-4">
        <input type="hidden" name="client_id" value={view.clientId} />
        <input type="hidden" name="redirect_uri" value={view.redirectUri} />
        <input type="hidden" name="state" value={view.state} />
        <input type="hidden" name="code_challenge" value={view.challenge} />
        <input type="hidden" name="resource" value={view.resource} />
        <TermButton type="submit" name="decision" value="approve" tone="ok">
          approve
        </TermButton>
        <TermButton type="submit" name="decision" value="deny" tone="danger">
          deny
        </TermButton>
      </form>
    </PageShell>
  );
}

function ErrorBox({ title, detail }: { title: string; detail: string }) {
  return (
    <PageShell cwd="~/oauth" title={title} lead={<p>{detail}</p>} />
  );
}
