import { hashSecret, oauthCorsHeaders, oauthJson } from "@/lib/oauth";
import { revokeRefreshToken } from "@/lib/oauth-store";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: oauthCorsHeaders });
}

export async function POST(request: Request) {
  const body = new URLSearchParams(await request.text());
  const token = body.get("token");
  if (token) {
    await revokeRefreshToken(hashSecret(token));
  }
  return oauthJson({});
}
