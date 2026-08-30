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

test("MCP is public to the proxy; site pages are not", () => {
  assert.equal(isPublicPath("/mcp"), true);
  assert.equal(isPublicPath("/mcp/"), true);
  assert.equal(isPublicPath("/sign-in"), true);
  assert.equal(isPublicPath("/api/auth/callback/google"), true);
  assert.equal(isPublicPath("/"), false);
  assert.equal(isPublicPath("/about"), false);
  assert.equal(isPublicPath("/work"), false);
});

test("callback URLs stay same-origin relative", () => {
  assert.equal(safeCallbackUrl("/work"), "/work");
  assert.equal(safeCallbackUrl("https://evil.example"), "/");
  assert.equal(safeCallbackUrl("//evil.example"), "/");
});
