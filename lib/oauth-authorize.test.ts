import assert from "node:assert/strict";
import { test } from "node:test";
import { pkceChallengeS256 } from "./oauth";
import { loadAuthorizationRequest } from "./oauth-authorize";
import { registerClient } from "./oauth-grant";
import { createMemoryStore, createObjectJsonStore, emptyDoc } from "./journal-store";

const challenge = pkceChallengeS256("verifier-value-that-is-long-enough");
const redirect = "http://127.0.0.1:9876/callback";

test("registered DCR client shows a ready consent view", async () => {
  const store = createMemoryStore();
  const { client } = await registerClient(
    { client_name: "Cursor", redirect_uris: [redirect] },
    store,
  );

  const view = await loadAuthorizationRequest(
    {
      response_type: "code",
      client_id: client.client_id,
      redirect_uri: redirect,
      code_challenge: challenge,
      code_challenge_method: "s256",
      scope: "journal",
    },
    store,
  );

  assert.equal(view.ok, true);
  if (view.ok) {
    assert.equal(view.client.client_name, "Cursor");
    assert.equal(view.redirectUri, redirect);
  }
});

test("unknown client is a 400 page, not a throw", async () => {
  const view = await loadAuthorizationRequest(
    {
      response_type: "code",
      client_id: "sven_cli_missing",
      redirect_uri: redirect,
      code_challenge: challenge,
    },
    createMemoryStore(),
  );
  assert.equal(view.ok, false);
  if (!view.ok) {
    assert.equal(view.status, 400);
    assert.equal(view.title, "Unknown client");
  }
});

test("omitted redirect_uri uses the client's only registered URI", async () => {
  const store = createMemoryStore();
  const { client } = await registerClient(
    { client_name: "Claude", redirect_uris: [redirect] },
    store,
  );
  const view = await loadAuthorizationRequest(
    {
      response_type: "code",
      client_id: client.client_id,
      code_challenge: challenge,
    },
    store,
  );
  assert.equal(view.ok, true);
  if (view.ok) {
    assert.equal(view.redirectUri, redirect);
  }
});

test("store read failure becomes a 400 page", async () => {
  const store = {
    kind: "memory" as const,
    async load(): Promise<never> {
      throw new Error("Vercel Blob: Failed to fetch blob: 500 Internal Server Error");
    },
    async update(): Promise<never> {
      throw new Error("unused");
    },
  };
  const view = await loadAuthorizationRequest(
    {
      client_id: "sven_cli_x",
      redirect_uri: redirect,
      code_challenge: challenge,
    },
    store,
  );
  assert.equal(view.ok, false);
  if (!view.ok) {
    assert.equal(view.status, 400);
    assert.match(view.title, /unavailable/i);
  }
});

test("DCR into an empty object store is visible to authorize", async () => {
  let stored: { text: string; etag?: string } | null = null;
  const store = createObjectJsonStore({
    async read() {
      return stored;
    },
    async write(text) {
      stored = { text, etag: "1" };
    },
  });

  const loaded = await store.load();
  assert.deepEqual(loaded.oauthClients, emptyDoc().oauthClients);

  const { client } = await registerClient(
    { client_name: "Grok", redirect_uris: [redirect] },
    store,
  );
  const view = await loadAuthorizationRequest(
    {
      response_type: "code",
      client_id: client.client_id,
      redirect_uri: redirect,
      code_challenge: challenge,
    },
    store,
  );
  assert.equal(view.ok, true);
  if (view.ok) {
    assert.equal(view.client.client_name, "Grok");
  }
});
