import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createObjectJsonStore,
  emptyDoc,
  isBlobPreconditionError,
  isMissingBlobError,
  parseDoc,
} from "./journal-store";

test("parseDoc fills missing OAuth collections", () => {
  const doc = parseDoc(JSON.stringify({ version: 1, items: [] }));
  assert.deepEqual(doc.oauthClients, []);
  assert.deepEqual(doc.oauthCodes, []);
  assert.deepEqual(doc.oauthRefresh, []);
});

test("parseDoc rejects invalid JSON instead of crashing later", () => {
  assert.throws(() => parseDoc(""), /not valid JSON/);
  assert.throws(() => parseDoc("<html>nope</html>"), /not valid JSON/);
});

test("missing-blob and precondition helpers match SDK and generic errors", () => {
  const notFound = new Error("Vercel Blob: Failed to fetch blob: 404 Not Found");
  notFound.name = "BlobError";
  assert.equal(isMissingBlobError(notFound), true);

  const typed = new Error("The requested blob does not exist");
  typed.name = "BlobNotFoundError";
  assert.equal(isMissingBlobError(typed), true);

  const mismatch = new Error("Vercel Blob: Precondition failed: ETag mismatch.");
  mismatch.name = "BlobError";
  assert.equal(isBlobPreconditionError(mismatch), true);

  const typedMismatch = new Error("Precondition failed: ETag mismatch.");
  typedMismatch.name = "BlobPreconditionFailedError";
  assert.equal(isBlobPreconditionError(typedMismatch), true);
});

test("object store creates an empty journal when the blob is missing", async () => {
  let stored: { text: string; etag?: string } | null = null;
  const writes: Array<string | undefined> = [];
  const store = createObjectJsonStore({
    async read() {
      return stored;
    },
    async write(text, etag) {
      writes.push(etag);
      stored = { text, etag: "etag-1" };
    },
  });

  const loaded = await store.load();
  assert.deepEqual(loaded, emptyDoc());
  assert.ok(stored);
  assert.equal(writes.length, 1);
  assert.equal(writes[0], undefined);
});

test("object store retries ETag mismatch and writes without ifMatch", async () => {
  let stored: { text: string; etag?: string } | null = {
    text: `${JSON.stringify(emptyDoc())}\n`,
    etag: "stale-download-etag",
  };
  const ifMatches: Array<string | undefined> = [];
  const store = createObjectJsonStore({
    async read() {
      return stored;
    },
    async write(text, etag) {
      ifMatches.push(etag);
      if (etag) {
        const error = new Error("Vercel Blob: Precondition failed: ETag mismatch.");
        error.name = "BlobPreconditionFailedError";
        throw error;
      }
      stored = { text, etag: "api-etag" };
    },
  });

  const next = await store.update((doc) => ({
    ...doc,
    oauthClients: [
      {
        client_id: "sven_cli_test",
        client_secret_hash: null,
        client_name: "Probe",
        redirect_uris: ["http://127.0.0.1:9/cb"],
        token_endpoint_auth_method: "none",
        createdAt: "2026-08-30T00:00:00.000Z",
        source: "dcr",
      },
    ],
  }));

  assert.equal(next.oauthClients[0]?.client_id, "sven_cli_test");
  assert.equal(ifMatches.at(-1), undefined);
  assert.ok(ifMatches.slice(0, -1).every((value) => value === "stale-download-etag"));
  const persisted = await store.load();
  assert.equal(persisted.oauthClients[0]?.client_name, "Probe");
});
