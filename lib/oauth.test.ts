import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { FORD_ACTOR } from "./actor";
import {
  hashSecret,
  isAllowedRedirectUri,
  pkceChallengeS256,
  signAccessToken,
  verifyAccessToken,
  verifyPkce,
} from "./oauth";
import {
  exchangeAuthorizationCode,
  issueAuthorizationCode,
  registerClient,
  verifyMcpAccessToken,
} from "./oauth-grant";
import { createMemoryStore, setStoreForTests } from "./journal-store";

afterEach(() => {
  setStoreForTests(null);
  delete process.env.AUTH_ALLOWED_EMAIL;
});

test("PKCE S256 round-trips", () => {
  const verifier = "a".repeat(43);
  const challenge = pkceChallengeS256(verifier);
  assert.equal(verifyPkce(verifier, challenge), true);
  assert.equal(verifyPkce("wrong-verifier-value-here-enough", challenge), false);
});

test("redirect URI policy allows localhost and https, not random http", () => {
  assert.equal(isAllowedRedirectUri("https://claude.ai/callback"), true);
  assert.equal(isAllowedRedirectUri("http://127.0.0.1:8787/callback"), true);
  assert.equal(isAllowedRedirectUri("cursor://oauth/callback"), true);
  assert.equal(isAllowedRedirectUri("http://evil.example/callback"), false);
  assert.equal(isAllowedRedirectUri("javascript:alert(1)"), false);
});

test("access token verifies for the MCP resource and owner", async () => {
  process.env.AUTH_SECRET = "test-oauth-secret";
  const token = await signAccessToken({
    issuer: "https://sven.example",
    resource: "https://sven.example/mcp",
    email: "fordheacock@gmail.com",
    clientId: "cursor",
    clientName: "Cursor",
  });
  const claims = await verifyAccessToken(
    token,
    "https://sven.example",
    "https://sven.example/mcp",
  );
  assert.ok(claims);
  assert.equal(claims?.sub, "fordheacock@gmail.com");
  assert.equal(
    await verifyAccessToken(token, "https://sven.example", "https://other.example/mcp"),
    null,
  );
  const mcp = await verifyMcpAccessToken(token, "https://sven.example");
  assert.equal(mcp?.client_name, "Cursor");
});

test("authorization code + PKCE issues a usable access token", async () => {
  process.env.AUTH_SECRET = "test-oauth-secret";
  const store = createMemoryStore();
  setStoreForTests(store);
  const { client } = await registerClient(
    {
      client_name: "Cursor",
      redirect_uris: ["http://127.0.0.1:9876/callback"],
      token_endpoint_auth_method: "none",
    },
    store,
  );
  const verifier = "pkce-verifier-value-that-is-long-enough";
  const code = await issueAuthorizationCode({
    client,
    redirectUri: "http://127.0.0.1:9876/callback",
    codeChallenge: pkceChallengeS256(verifier),
    resource: "https://sven.example/mcp",
    email: "fordheacock@gmail.com",
    store,
  });
  const tokens = await exchangeAuthorizationCode({
    issuer: "https://sven.example",
    code,
    redirectUri: "http://127.0.0.1:9876/callback",
    codeVerifier: verifier,
    resource: "https://sven.example/mcp",
    store,
  });
  const claims = await verifyMcpAccessToken(tokens.access_token, "https://sven.example");
  assert.ok(claims);
  assert.equal(claims?.client_name, "Cursor");
  assert.ok(tokens.refresh_token.startsWith("sven_rt_"));
  assert.notEqual(hashSecret(tokens.refresh_token), tokens.refresh_token);
});

test("denied email cannot be issued a code", async () => {
  const store = createMemoryStore();
  const { client } = await registerClient(
    {
      client_name: "Stranger",
      redirect_uris: ["http://localhost:3000/cb"],
    },
    store,
  );
  await assert.rejects(
    () =>
      issueAuthorizationCode({
        client,
        redirectUri: "http://localhost:3000/cb",
        codeChallenge: pkceChallengeS256("verifier-value-long-enough-here"),
        resource: "https://sven.example/mcp",
        email: "not-ford@example.com",
        store,
      }),
    /not allowed/,
  );
  void FORD_ACTOR;
});
