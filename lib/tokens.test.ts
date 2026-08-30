import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  createToken,
  hashToken,
  revokeToken,
  verifyAgentToken,
} from "./agent-tokens";
import { createMemoryStore, setStoreForTests } from "./journal-store";

afterEach(() => {
  setStoreForTests(null);
});

test("minted token verifies and is hashed at rest", async () => {
  const store = createMemoryStore();
  setStoreForTests(store);
  const created = await createToken("Cursor Cloud", "cursor", store);
  assert.match(created.token, /^sven_/);
  assert.equal(created.prefix, created.token.slice(0, 12));

  const listed = await store.load();
  assert.equal(listed.tokens.length, 1);
  assert.equal(listed.tokens[0]?.hash, hashToken(created.token));
  assert.notEqual(listed.tokens[0]?.hash, created.token);

  const verified = await verifyAgentToken(created.token, store);
  assert.ok(verified);
  assert.equal(verified?.name, "Cursor Cloud");
  assert.equal(verified?.platform, "cursor");
});

test("revoked and unknown tokens are rejected", async () => {
  const store = createMemoryStore();
  const created = await createToken("Claude", "claude", store);
  await revokeToken(created.id, store);
  assert.equal(await verifyAgentToken(created.token, store), null);
  assert.equal(await verifyAgentToken("sven_not-a-real-token", store), null);
  assert.equal(await verifyAgentToken("totally-wrong", store), null);
});
