import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const JOURNAL_SCOPE = "journal";
export const ACCESS_TOKEN_TTL_SEC = 60 * 60;
export const REFRESH_TOKEN_TTL_SEC = 60 * 60 * 24 * 30;
export const AUTH_CODE_TTL_SEC = 10 * 60;

export type OAuthClient = {
  client_id: string;
  client_secret_hash: string | null;
  client_name: string;
  redirect_uris: string[];
  token_endpoint_auth_method: "none" | "client_secret_post" | "client_secret_basic";
  createdAt: string;
  source: "dcr" | "cimd";
};

export type AuthCodeRecord = {
  code_hash: string;
  client_id: string;
  client_name: string;
  redirect_uri: string;
  code_challenge: string;
  resource: string;
  scope: string;
  email: string;
  expiresAt: number;
};

export type RefreshRecord = {
  token_hash: string;
  client_id: string;
  client_name: string;
  resource: string;
  scope: string;
  email: string;
  expiresAt: number;
};

export type AccessClaims = {
  iss: string;
  aud: string;
  sub: string;
  client_id: string;
  client_name: string;
  scope: string;
  exp: number;
  iat: number;
  jti: string;
};

function secretBytes(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET?.trim() ||
    process.env.JOURNAL_TOKEN_PEPPER?.trim() ||
    "dev-only-not-for-production";
  return new TextEncoder().encode(secret);
}

export function hashSecret(value: string): string {
  const pepper =
    process.env.AUTH_SECRET?.trim() ||
    process.env.JOURNAL_TOKEN_PEPPER?.trim() ||
    "dev-only-not-for-production";
  return createHmac("sha256", pepper).update(value).digest("hex");
}

export function secretsEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function randomToken(prefix: string, bytes = 32): string {
  return `${prefix}${randomBytes(bytes).toString("base64url")}`;
}

export function pkceChallengeS256(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function verifyPkce(verifier: string, challenge: string): boolean {
  if (!verifier || !challenge) return false;
  return secretsEqual(pkceChallengeS256(verifier), challenge);
}

export function issuerFromRequest(request: Request): string {
  const configured = process.env.AUTH_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    const host = forwardedHost.split(",")[0]?.trim();
    const proto = forwardedProto?.split(",")[0]?.trim() || "https";
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}

export function resourceUrl(issuer: string): string {
  return `${issuer.replace(/\/$/, "")}/mcp`;
}

export function isAllowedRedirectUri(uri: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    return false;
  }
  if (parsed.protocol === "https:") return true;
  if (parsed.protocol === "http:") {
    return (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "[::1]"
    );
  }
  // Native app callbacks such as cursor://...
  return parsed.protocol.length > 1 && parsed.protocol !== "javascript:";
}

export function redirectUrisMatch(allowed: string[], requested: string): boolean {
  return allowed.includes(requested);
}

export async function signAccessToken(claims: {
  issuer: string;
  resource: string;
  email: string;
  clientId: string;
  clientName: string;
  scope?: string;
}): Promise<string> {
  return new SignJWT({
    client_id: claims.clientId,
    client_name: claims.clientName,
    scope: claims.scope ?? JOURNAL_SCOPE,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(claims.issuer)
    .setAudience(claims.resource)
    .setSubject(claims.email)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SEC}s`)
    .setJti(randomBytes(12).toString("hex"))
    .sign(secretBytes());
}

export async function verifyAccessToken(
  token: string,
  issuer: string,
  resource: string,
): Promise<AccessClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretBytes(), {
      issuer,
      audience: resource,
      algorithms: ["HS256"],
    });
    return asAccessClaims(payload);
  } catch {
    return null;
  }
}

function asAccessClaims(payload: JWTPayload): AccessClaims | null {
  if (
    typeof payload.iss !== "string" ||
    typeof payload.aud !== "string" ||
    typeof payload.sub !== "string" ||
    typeof payload.client_id !== "string" ||
    typeof payload.exp !== "number" ||
    typeof payload.iat !== "number"
  ) {
    return null;
  }
  return {
    iss: payload.iss,
    aud: payload.aud,
    sub: payload.sub,
    client_id: payload.client_id,
    client_name:
      typeof payload.client_name === "string" ? payload.client_name : "agent",
    scope: typeof payload.scope === "string" ? payload.scope : JOURNAL_SCOPE,
    exp: payload.exp,
    iat: payload.iat,
    jti: typeof payload.jti === "string" ? payload.jti : "",
  };
}

export function authorizationServerMetadata(issuer: string) {
  const base = issuer.replace(/\/$/, "");
  return {
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/oauth/token`,
    registration_endpoint: `${base}/oauth/register`,
    revocation_endpoint: `${base}/oauth/revoke`,
    scopes_supported: [JOURNAL_SCOPE],
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: [
      "none",
      "client_secret_post",
      "client_secret_basic",
    ],
    client_id_metadata_document_supported: true,
    authorization_response_iss_parameter_supported: true,
  };
}

export function protectedResourceMetadata(issuer: string) {
  const base = issuer.replace(/\/$/, "");
  return {
    resource: resourceUrl(base),
    authorization_servers: [base],
    scopes_supported: [JOURNAL_SCOPE],
    bearer_methods_supported: ["header"],
    resource_documentation: `${base}/`,
  };
}

export type CimdDocument = {
  client_id: string;
  client_name?: string;
  redirect_uris: string[];
  token_endpoint_auth_method?: string;
};

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "127.0.0.1" || host === "0.0.0.0" || host === "::1") return true;
  if (host.endsWith(".internal") || host.endsWith(".local")) return true;
  const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

export async function fetchCimdDocument(
  clientId: string,
): Promise<CimdDocument | null> {
  let url: URL;
  try {
    url = new URL(clientId);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (isPrivateHostname(url.hostname)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const body = (await response.json()) as Partial<CimdDocument>;
    if (body.client_id !== clientId) return null;
    if (!Array.isArray(body.redirect_uris) || body.redirect_uris.length === 0) {
      return null;
    }
    return {
      client_id: clientId,
      client_name: body.client_name,
      redirect_uris: body.redirect_uris.filter(
        (uri): uri is string => typeof uri === "string",
      ),
      token_endpoint_auth_method: body.token_endpoint_auth_method,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function oauthError(
  status: number,
  error: string,
  description: string,
  extra?: Record<string, string>,
): Response {
  return new Response(JSON.stringify({ error, error_description: description, ...extra }), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...oauthCorsHeaders,
    },
  });
}

export const oauthCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, Accept, MCP-Protocol-Version",
};

export function oauthJson(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...oauthCorsHeaders,
    },
  });
}
