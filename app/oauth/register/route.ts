import { oauthCorsHeaders, oauthError, oauthJson } from "@/lib/oauth";
import { registerClient } from "@/lib/oauth-grant";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: oauthCorsHeaders });
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return oauthError(400, "invalid_client_metadata", "Expected JSON body.");
  }

  const redirectUris = Array.isArray(body.redirect_uris)
    ? body.redirect_uris.filter((uri): uri is string => typeof uri === "string")
    : [];

  try {
    const { client, client_secret } = await registerClient({
      client_name: typeof body.client_name === "string" ? body.client_name : undefined,
      redirect_uris: redirectUris,
      token_endpoint_auth_method:
        typeof body.token_endpoint_auth_method === "string"
          ? body.token_endpoint_auth_method
          : undefined,
    });
    return oauthJson(
      {
        client_id: client.client_id,
        client_secret,
        client_name: client.client_name,
        redirect_uris: client.redirect_uris,
        token_endpoint_auth_method: client.token_endpoint_auth_method,
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        client_id_issued_at: Math.floor(Date.parse(client.createdAt) / 1000),
      },
      201,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not register client.";
    return oauthError(400, "invalid_client_metadata", message);
  }
}
