import { isAllowedRedirectUri, redirectUrisMatch } from "./oauth";
import { resolveClient, type ResolvedClient } from "./oauth-grant";
import { getStore, type JournalStore } from "./journal-store";

export type AuthorizeQuery = {
  client_id?: string | string[];
  redirect_uri?: string | string[];
  state?: string | string[];
  code_challenge?: string | string[];
  code_challenge_method?: string | string[];
  response_type?: string | string[];
  resource?: string | string[];
  scope?: string | string[];
};

export type AuthorizeReady = {
  ok: true;
  client: ResolvedClient;
  clientId: string;
  redirectUri: string;
  state: string;
  challenge: string;
  resource: string;
  scope: string;
};

export type AuthorizeFailure = {
  ok: false;
  status: 400;
  title: string;
  detail: string;
};

export type AuthorizeView = AuthorizeReady | AuthorizeFailure;

export function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? (value[0] ?? "") : (value ?? "")).trim();
}

function fail(title: string, detail: string): AuthorizeFailure {
  return { ok: false, status: 400, title, detail };
}

export function pickRedirectUri(
  client: ResolvedClient,
  requested: string,
): string | null {
  if (requested) {
    if (
      isAllowedRedirectUri(requested) &&
      redirectUrisMatch(client.redirect_uris, requested)
    ) {
      return requested;
    }
    return null;
  }
  const allowed = (client.redirect_uris ?? []).filter(isAllowedRedirectUri);
  return allowed.length === 1 ? allowed[0] : null;
}

export async function loadAuthorizationRequest(
  query: AuthorizeQuery,
  store: JournalStore = getStore(),
): Promise<AuthorizeView> {
  const clientId = firstParam(query.client_id);
  const redirectUri = firstParam(query.redirect_uri);
  const state = firstParam(query.state);
  const challenge = firstParam(query.code_challenge);
  const method = (firstParam(query.code_challenge_method) || "S256").toUpperCase();
  const responseType = firstParam(query.response_type);
  const resource = firstParam(query.resource);
  const scope = firstParam(query.scope);

  if (responseType && responseType !== "code") {
    return fail(
      "Unsupported response type",
      "This server only issues authorization codes.",
    );
  }
  if (!clientId) {
    return fail(
      "Incomplete authorization request",
      "The client must send client_id and a PKCE code_challenge.",
    );
  }
  if (!challenge) {
    return fail(
      "Incomplete authorization request",
      "The client must send client_id and a PKCE code_challenge.",
    );
  }
  if (method !== "S256") {
    return fail("PKCE required", "code_challenge_method must be S256.");
  }

  let client: ResolvedClient | null;
  try {
    client = await resolveClient(clientId, store);
  } catch {
    return fail(
      "Authorization server unavailable",
      "The client registry could not be read. Retry the request.",
    );
  }
  if (!client) {
    return fail(
      "Unknown client",
      "Register via Dynamic Client Registration or present a Client ID Metadata Document URL.",
    );
  }

  const resolvedRedirect = pickRedirectUri(client, redirectUri);
  if (!resolvedRedirect) {
    return fail(
      "Redirect URI is not allowed",
      redirectUri
        ? "The redirect_uri is not registered for this client."
        : "This client has no single registered redirect_uri to default to.",
    );
  }

  return {
    ok: true,
    client,
    clientId: client.client_id,
    redirectUri: resolvedRedirect,
    state,
    challenge,
    resource,
    scope,
  };
}
