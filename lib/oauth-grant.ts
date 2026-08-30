import { isAllowedEmail } from "./authz";
import {
  ACCESS_TOKEN_TTL_SEC,
  AUTH_CODE_TTL_SEC,
  JOURNAL_SCOPE,
  REFRESH_TOKEN_TTL_SEC,
  fetchCimdDocument,
  hashSecret,
  isAllowedRedirectUri,
  randomToken,
  redirectUrisMatch,
  resourceUrl,
  secretsEqual,
  signAccessToken,
  verifyAccessToken,
  verifyPkce,
  type AccessClaims,
  type OAuthClient,
} from "./oauth";
import {
  consumeAuthCode,
  consumeRefreshToken,
  getClient,
  saveAuthCode,
  saveClient,
  saveRefreshToken,
} from "./oauth-store";
import { getStore, type JournalStore } from "./journal-store";

export type ResolvedClient = OAuthClient;

export async function resolveClient(
  clientId: string,
  store: JournalStore = getStore(),
): Promise<ResolvedClient | null> {
  const stored = await getClient(clientId, store);
  if (stored) return stored;
  if (clientId.startsWith("https://")) {
    const cimd = await fetchCimdDocument(clientId);
    if (!cimd) return null;
    const client: OAuthClient = {
      client_id: cimd.client_id,
      client_secret_hash: null,
      client_name: cimd.client_name?.trim() || hostnameName(clientId),
      redirect_uris: cimd.redirect_uris.filter(isAllowedRedirectUri),
      token_endpoint_auth_method: "none",
      createdAt: new Date().toISOString(),
      source: "cimd",
    };
    if (client.redirect_uris.length === 0) return null;
    await saveClient(client, store);
    return client;
  }
  return null;
}

function hostnameName(clientId: string): string {
  try {
    return new URL(clientId).hostname;
  } catch {
    return "agent";
  }
}

export async function registerClient(
  input: {
    client_name?: string;
    redirect_uris?: string[];
    token_endpoint_auth_method?: string;
    grant_types?: string[];
  },
  store: JournalStore = getStore(),
): Promise<{ client: OAuthClient; client_secret?: string }> {
  const redirectUris = (input.redirect_uris ?? []).filter(
    (uri) => typeof uri === "string" && isAllowedRedirectUri(uri),
  );
  if (redirectUris.length === 0) {
    throw new Error("At least one valid redirect_uri is required.");
  }
  const method =
    input.token_endpoint_auth_method === "client_secret_post" ||
    input.token_endpoint_auth_method === "client_secret_basic"
      ? input.token_endpoint_auth_method
      : "none";
  const clientId = randomToken("sven_cli_");
  const clientSecret = method === "none" ? undefined : randomToken("sven_sec_");
  const client: OAuthClient = {
    client_id: clientId,
    client_secret_hash: clientSecret ? hashSecret(clientSecret) : null,
    client_name: input.client_name?.trim() || "MCP client",
    redirect_uris: redirectUris,
    token_endpoint_auth_method: method,
    createdAt: new Date().toISOString(),
    source: "dcr",
  };
  await saveClient(client, store);
  return { client, client_secret: clientSecret };
}

export async function issueAuthorizationCode(input: {
  client: ResolvedClient;
  redirectUri: string;
  codeChallenge: string;
  resource: string;
  email: string;
  store?: JournalStore;
}): Promise<string> {
  if (!redirectUrisMatch(input.client.redirect_uris, input.redirectUri)) {
    throw new Error("redirect_uri is not registered for this client.");
  }
  if (!isAllowedEmail(input.email)) {
    throw new Error("This Google account is not allowed.");
  }
  const code = randomToken("sven_code_");
  await saveAuthCode(
    {
      code_hash: hashSecret(code),
      client_id: input.client.client_id,
      client_name: input.client.client_name,
      redirect_uri: input.redirectUri,
      code_challenge: input.codeChallenge,
      resource: input.resource,
      scope: JOURNAL_SCOPE,
      email: input.email.trim().toLowerCase(),
      expiresAt: Math.floor(Date.now() / 1000) + AUTH_CODE_TTL_SEC,
    },
    input.store ?? getStore(),
  );
  return code;
}

export async function exchangeAuthorizationCode(input: {
  issuer: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
  resource?: string | null;
  store?: JournalStore;
}): Promise<{
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope: string;
}> {
  const store = input.store ?? getStore();
  const record = await consumeAuthCode(hashSecret(input.code), store);
  if (!record) throw new Error("invalid_grant");
  if (record.redirect_uri !== input.redirectUri) throw new Error("invalid_grant");
  if (!verifyPkce(input.codeVerifier, record.code_challenge)) {
    throw new Error("invalid_grant");
  }
  const expectedResource = input.resource || record.resource;
  if (expectedResource !== record.resource) throw new Error("invalid_target");
  return issueTokenPair({
    issuer: input.issuer,
    resource: record.resource,
    email: record.email,
    clientId: record.client_id,
    clientName: record.client_name,
    scope: record.scope,
    store,
  });
}

export async function exchangeRefreshToken(input: {
  issuer: string;
  refreshToken: string;
  resource?: string | null;
  store?: JournalStore;
}): Promise<{
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope: string;
}> {
  const store = input.store ?? getStore();
  const record = await consumeRefreshToken(hashSecret(input.refreshToken), store);
  if (!record) throw new Error("invalid_grant");
  if (input.resource && input.resource !== record.resource) {
    throw new Error("invalid_target");
  }
  return issueTokenPair({
    issuer: input.issuer,
    resource: record.resource,
    email: record.email,
    clientId: record.client_id,
    clientName: record.client_name,
    scope: record.scope,
    store,
  });
}

async function issueTokenPair(input: {
  issuer: string;
  resource: string;
  email: string;
  clientId: string;
  clientName: string;
  scope: string;
  store: JournalStore;
}) {
  const access_token = await signAccessToken({
    issuer: input.issuer,
    resource: input.resource,
    email: input.email,
    clientId: input.clientId,
    clientName: input.clientName,
    scope: input.scope,
  });
  const refresh_token = randomToken("sven_rt_");
  await saveRefreshToken(
    {
      token_hash: hashSecret(refresh_token),
      client_id: input.clientId,
      client_name: input.clientName,
      resource: input.resource,
      scope: input.scope,
      email: input.email,
      expiresAt: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_TTL_SEC,
    },
    input.store,
  );
  return {
    access_token,
    refresh_token,
    token_type: "Bearer" as const,
    expires_in: ACCESS_TOKEN_TTL_SEC,
    scope: input.scope,
  };
}

export async function authenticateClient(
  request: Request,
  body: URLSearchParams,
  store: JournalStore = getStore(),
): Promise<ResolvedClient | null> {
  const basic = request.headers.get("authorization");
  let clientId = body.get("client_id");
  let clientSecret = body.get("client_secret");
  if (basic?.toLowerCase().startsWith("basic ")) {
    try {
      const decoded = atob(basic.slice(6).trim());
      const idx = decoded.indexOf(":");
      clientId = decoded.slice(0, idx);
      clientSecret = decoded.slice(idx + 1);
    } catch {
      return null;
    }
  }
  if (!clientId) return null;
  const client = await resolveClient(clientId, store);
  if (!client) return null;
  if (client.token_endpoint_auth_method === "none") return client;
  if (!client.client_secret_hash || !clientSecret) return null;
  if (!secretsEqual(client.client_secret_hash, hashSecret(clientSecret))) {
    return null;
  }
  return client;
}

export async function verifyMcpAccessToken(
  token: string,
  issuer: string,
): Promise<AccessClaims | null> {
  const resource = resourceUrl(issuer);
  const claims = await verifyAccessToken(token, issuer, resource);
  if (!claims) return null;
  if (!isAllowedEmail(claims.sub)) return null;
  if (claims.scope && !claims.scope.split(/[ +]/).includes(JOURNAL_SCOPE)) {
    return null;
  }
  return claims;
}

export function expectedResourceForIssuer(issuer: string): string {
  return resourceUrl(issuer);
}
