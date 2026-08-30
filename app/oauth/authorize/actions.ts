"use server";

import { redirect } from "next/navigation";
import { issuerFromRequest, isAllowedRedirectUri, redirectUrisMatch } from "@/lib/oauth";
import { issueAuthorizationCode, resolveClient } from "@/lib/oauth-grant";
import { requireOwner } from "@/lib/require-owner";
import { headers } from "next/headers";

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function appendQuery(url: URL, params: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
}

export async function decideAuthorization(formData: FormData): Promise<void> {
  const user = await requireOwner();
  const clientId = asString(formData.get("client_id"));
  const redirectUri = asString(formData.get("redirect_uri"));
  const state = asString(formData.get("state"));
  const codeChallenge = asString(formData.get("code_challenge"));
  const resource = asString(formData.get("resource"));
  const decision = asString(formData.get("decision"));

  const client = await resolveClient(clientId);
  if (!client || !isAllowedRedirectUri(redirectUri) || !redirectUrisMatch(client.redirect_uris, redirectUri)) {
    throw new Error("This client is not allowed to redirect there.");
  }

  const target = new URL(redirectUri);
  if (decision !== "approve") {
    appendQuery(target, {
      error: "access_denied",
      error_description: "Ford denied the request.",
      state,
    });
    redirect(target.toString());
  }

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const request = new Request(`${proto}://${host}/oauth/authorize`);
  const issuer = issuerFromRequest(request);
  const expectedResource = resource || `${issuer}/mcp`;

  const code = await issueAuthorizationCode({
    client,
    redirectUri,
    codeChallenge,
    resource: expectedResource,
    email: user.email ?? "",
  });

  appendQuery(target, {
    code,
    state,
    iss: issuer,
  });
  redirect(target.toString());
}
