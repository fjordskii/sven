import assert from "node:assert/strict";
import { test } from "node:test";
import { isAllowedEmail, isPublicPath, safeCallbackUrl } from "./authz";

test("Google allowlist stays exact and case-insensitive", () => {
  assert.equal(isAllowedEmail("fordheacock@gmail.com"), true);
  assert.equal(isAllowedEmail("FordHeacock@Gmail.com"), true);
  assert.equal(isAllowedEmail("someone@else.com"), false);
  assert.equal(isAllowedEmail(""), false);
  assert.equal(isAllowedEmail(null), false);
});

test("MCP and OAuth machine endpoints are public; authorize and site pages are not", () => {
  assert.equal(isPublicPath("/mcp"), true);
  assert.equal(isPublicPath("/.well-known/oauth-protected-resource"), true);
  assert.equal(isPublicPath("/.well-known/oauth-authorization-server"), true);
  assert.equal(isPublicPath("/oauth/register"), true);
  assert.equal(isPublicPath("/oauth/token"), true);
  assert.equal(isPublicPath("/oauth/revoke"), true);
  assert.equal(isPublicPath("/sign-in"), true);
  assert.equal(isPublicPath("/oauth/authorize"), false);
  assert.equal(isPublicPath("/"), false);
  assert.equal(isPublicPath("/about"), false);
});

test("callback URLs stay same-origin relative", () => {
  assert.equal(safeCallbackUrl("/work"), "/work");
  assert.equal(safeCallbackUrl("https://evil.example"), "/");
  assert.equal(safeCallbackUrl("//evil.example"), "/");
});
