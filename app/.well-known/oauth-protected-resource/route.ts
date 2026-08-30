import {
  issuerFromRequest,
  oauthCorsHeaders,
  oauthJson,
  protectedResourceMetadata,
} from "@/lib/oauth";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return oauthJson(protectedResourceMetadata(issuerFromRequest(request)));
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: oauthCorsHeaders });
}
