import { test } from "node:test";
import assert from "node:assert/strict";
import { createSessionToken, verifySessionToken, SESSION_MAX_AGE } from "./session";

test("session token round-trip, tamper, expiry", () => {
  const now = Date.UTC(2026, 10, 9);
  const t = createSessionToken("s3cret", now);
  assert.equal(verifySessionToken(t, "s3cret", now), true);
  assert.equal(verifySessionToken(t, "other", now), false);
  assert.equal(verifySessionToken(t.replace("owner", "admin"), "s3cret", now), false);
  assert.equal(verifySessionToken(t, "s3cret", now + (SESSION_MAX_AGE + 1) * 1000), false);
  assert.equal(verifySessionToken(undefined, "s3cret", now), false);
  assert.equal(verifySessionToken(t, undefined, now), false);
});
