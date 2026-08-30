import { issuerFromRequest, oauthCorsHeaders, oauthError, oauthJson } from "@/lib/oauth";
import {
  authenticateClient,
  exchangeAuthorizationCode,
  exchangeRefreshToken,
} from "@/lib/oauth-grant";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: oauthCorsHeaders });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return oauthError(
      400,
      "invalid_request",
      "token endpoint expects application/x-www-form-urlencoded.",
    );
  }

  const body = new URLSearchParams(await request.text());
  const grant = body.get("grant_type");
  const issuer = issuerFromRequest(request);
  const client = await authenticateClient(request, body);
  if (!client) {
    return oauthError(401, "invalid_client", "Unknown or unauthenticated client.");
  }

  try {
    if (grant === "authorization_code") {
      const code = body.get("code");
      const redirectUri = body.get("redirect_uri");
      const verifier = body.get("code_verifier");
      if (!code || !redirectUri || !verifier) {
        return oauthError(400, "invalid_request", "code, redirect_uri, and code_verifier are required.");
      }
      if (body.get("client_id") && body.get("client_id") !== client.client_id) {
        return oauthError(400, "invalid_client", "client_id does not match.");
      }
      const tokens = await exchangeAuthorizationCode({
        issuer,
        code,
        redirectUri,
        codeVerifier: verifier,
        resource: body.get("resource"),
      });
      return oauthJson(tokens);
    }

    if (grant === "refresh_token") {
      const refresh = body.get("refresh_token");
      if (!refresh) {
        return oauthError(400, "invalid_request", "refresh_token is required.");
      }
      const tokens = await exchangeRefreshToken({
        issuer,
        refreshToken: refresh,
        resource: body.get("resource"),
      });
      return oauthJson(tokens);
    }

    return oauthError(400, "unsupported_grant_type", "Use authorization_code or refresh_token.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_grant";
    const code =
      message === "invalid_target" ? "invalid_target" : "invalid_grant";
    return oauthError(400, code, "The authorization grant is invalid or expired.");
  }
}
