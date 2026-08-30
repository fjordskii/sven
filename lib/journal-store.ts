import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AuthCodeRecord, OAuthClient, RefreshRecord } from "./oauth";
import type { WorkItem } from "./journal-model";

export type StoreDoc = {
  version: 1;
  items: WorkItem[];
  oauthClients: OAuthClient[];
  oauthCodes: AuthCodeRecord[];
  oauthRefresh: RefreshRecord[];
};

export type StoreKind = "blob" | "file" | "memory" | "unconfigured";

export type StorageStatus = {
  kind: StoreKind;
  ready: boolean;
  message?: string;
};

export type JournalStore = {
  kind: StoreKind;
  load(): Promise<StoreDoc>;
  update(fn: (doc: StoreDoc) => StoreDoc): Promise<StoreDoc>;
};

export type JsonObjectIo = {
  read(): Promise<{ text: string; etag?: string } | null>;
  write(text: string, etag?: string): Promise<void>;
};

const BLOB_PATH = "sven/journal.json";

let overrideStore: JournalStore | null = null;
let defaultStore: JournalStore | null = null;

export function emptyDoc(): StoreDoc {
  return {
    version: 1,
    items: [],
    oauthClients: [],
    oauthCodes: [],
    oauthRefresh: [],
  };
}

export function setStoreForTests(store: JournalStore | null): void {
  overrideStore = store;
}

export function createMemoryStore(initial?: Partial<StoreDoc>): JournalStore {
  let doc: StoreDoc = {
    ...emptyDoc(),
    ...initial,
    items: initial?.items ? [...initial.items] : [],
    oauthClients: initial?.oauthClients ? [...initial.oauthClients] : [],
    oauthCodes: initial?.oauthCodes ? [...initial.oauthCodes] : [],
    oauthRefresh: initial?.oauthRefresh ? [...initial.oauthRefresh] : [],
  };
  return {
    kind: "memory",
    async load() {
      return structuredClone(doc);
    },
    async update(fn) {
      doc = structuredClone(fn(structuredClone(doc)));
      return structuredClone(doc);
    },
  };
}

function cloneDoc(doc: StoreDoc): StoreDoc {
  return {
    version: 1,
    items: [...doc.items],
    oauthClients: [...doc.oauthClients],
    oauthCodes: [...doc.oauthCodes],
    oauthRefresh: [...doc.oauthRefresh],
  };
}

export function parseDoc(raw: string): StoreDoc {
  let parsed: Partial<StoreDoc>;
  try {
    parsed = JSON.parse(raw) as Partial<StoreDoc>;
  } catch {
    throw new Error("Journal blob is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Journal blob is not valid JSON.");
  }
  return {
    version: 1,
    items: Array.isArray(parsed.items) ? (parsed.items as WorkItem[]) : [],
    oauthClients: Array.isArray(parsed.oauthClients)
      ? (parsed.oauthClients as OAuthClient[])
      : [],
    oauthCodes: Array.isArray(parsed.oauthCodes)
      ? (parsed.oauthCodes as AuthCodeRecord[])
      : [],
    oauthRefresh: Array.isArray(parsed.oauthRefresh)
      ? (parsed.oauthRefresh as RefreshRecord[])
      : [],
  };
}

export function normalizeEtag(etag: string | undefined | null): string | undefined {
  const trimmed = etag?.trim();
  return trimmed ? trimmed : undefined;
}

export function isMissingBlobError(error: unknown): boolean {
  if (error == null) return true;
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : String(error);
  return (
    name === "BlobNotFoundError" ||
    /failed to fetch blob:\s*404/i.test(message) ||
    /requested blob does not exist/i.test(message) ||
    /blob not found/i.test(message)
  );
}

export function isBlobPreconditionError(error: unknown): boolean {
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : String(error);
  return (
    name === "BlobPreconditionFailedError" ||
    /precondition failed/i.test(message) ||
    /etag mismatch/i.test(message)
  );
}

export async function readStreamText(
  stream: ReadableStream<Uint8Array> | NodeJS.ReadableStream,
): Promise<string> {
  const web = stream as ReadableStream<Uint8Array>;
  if (typeof web.getReader === "function") {
    const reader = web.getReader();
    const chunks: Uint8Array[] = [];
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
    } finally {
      try {
        reader.releaseLock();
      } catch {
        /* already released */
      }
    }
    return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
  }

  const chunks: Buffer[] = [];
  for await (const chunk of stream as NodeJS.ReadableStream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function createObjectJsonStore(
  io: JsonObjectIo,
  kind: StoreKind = "blob",
): JournalStore {
  async function loadRaw(): Promise<{
    doc: StoreDoc;
    etag?: string;
    exists: boolean;
  }> {
    const result = await io.read();
    if (!result) {
      return { doc: emptyDoc(), exists: false };
    }
    const etag = normalizeEtag(result.etag);
    if (!result.text.trim()) {
      return { doc: emptyDoc(), etag, exists: true };
    }
    return { doc: parseDoc(result.text), etag, exists: true };
  }

  async function persist(doc: StoreDoc, etag?: string): Promise<void> {
    await io.write(`${JSON.stringify(doc)}\n`, etag);
  }

  return {
    kind,
    async load() {
      const loaded = await loadRaw();
      if (!loaded.exists) {
        try {
          await persist(loaded.doc);
        } catch (error) {
          if (!isBlobPreconditionError(error)) throw error;
          return cloneDoc((await loadRaw()).doc);
        }
      }
      return cloneDoc(loaded.doc);
    },
    async update(fn) {
      let lastError: unknown;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const loaded = await loadRaw();
        const next = fn(cloneDoc(loaded.doc));
        // Last attempt writes without ifMatch so a download ETag / API ETag
        // mismatch cannot permanently block DCR or token exchange.
        const etag = attempt < 3 ? loaded.etag : undefined;
        try {
          await persist(next, etag);
          return cloneDoc(next);
        } catch (error) {
          lastError = error;
          if (isBlobPreconditionError(error)) continue;
          throw error;
        }
      }
      throw lastError instanceof Error
        ? lastError
        : new Error("Journal write conflict. Try again.");
    },
  };
}

function dataDir(): string {
  return process.env.JOURNAL_DATA_DIR?.trim() || path.join(process.cwd(), ".data");
}

function createFileStore(): JournalStore {
  const filePath = path.join(dataDir(), "journal.json");
  let queue: Promise<unknown> = Promise.resolve();

  async function read(): Promise<StoreDoc> {
    try {
      const raw = await readFile(filePath, "utf8");
      if (!raw.trim()) {
        const doc = emptyDoc();
        await write(doc);
        return doc;
      }
      return parseDoc(raw);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        const doc = emptyDoc();
        await write(doc);
        return doc;
      }
      throw error;
    }
  }

  async function write(doc: StoreDoc): Promise<void> {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  }

  function enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const run = queue.then(fn, fn);
    queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  return {
    kind: "file",
    load: () => enqueue(read),
    update: (fn) =>
      enqueue(async () => {
        const next = fn(await read());
        await write(next);
        return cloneDoc(next);
      }),
  };
}

function blobConfigured(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.BLOB_STORE_ID ||
      (process.env.VERCEL && process.env.VERCEL_OIDC_TOKEN),
  );
}

async function createBlobStore(): Promise<JournalStore> {
  const { get, head, put } = await import("@vercel/blob");

  return createObjectJsonStore({
    async read() {
      let text: string | null;
      try {
        const result = await get(BLOB_PATH, {
          access: "private",
          useCache: false,
        });
        if (!result || result.statusCode !== 200 || !result.stream) {
          text = null;
        } else {
          text = await readStreamText(result.stream);
        }
      } catch (error) {
        if (isMissingBlobError(error)) return null;
        throw error;
      }
      if (text === null) return null;

      let etag: string | undefined;
      try {
        const meta = await head(BLOB_PATH);
        etag = normalizeEtag(meta.etag);
      } catch (error) {
        if (!isMissingBlobError(error)) {
          etag = undefined;
        }
      }
      return { text, etag };
    },
    async write(text, etag) {
      await put(BLOB_PATH, text, {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
        cacheControlMaxAge: 60,
        ...(etag ? { ifMatch: etag } : {}),
      });
    },
  });
}

export function storageStatus(): StorageStatus {
  if (process.env.JOURNAL_FORCE_FILE === "1") {
    return { kind: "file", ready: true };
  }
  if (blobConfigured()) {
    return { kind: "blob", ready: true };
  }
  if (process.env.VERCEL) {
    return {
      kind: "unconfigured",
      ready: false,
      message:
        "Create a private Vercel Blob store and connect it to this project. Until then the journal cannot persist across deploys.",
    };
  }
  return { kind: "file", ready: true };
}

export function getStore(): JournalStore {
  if (overrideStore) return overrideStore;
  if (defaultStore) return defaultStore;

  const status = storageStatus();
  if (status.kind === "unconfigured") {
    throw new Error(status.message);
  }
  if (status.kind === "blob") {
    let inner: Promise<JournalStore> | null = null;
    const store: JournalStore = {
      kind: "blob",
      async load() {
        inner ??= createBlobStore();
        return (await inner).load();
      },
      async update(fn) {
        inner ??= createBlobStore();
        return (await inner).update(fn);
      },
    };
    defaultStore = store;
    return store;
  }

  defaultStore = createFileStore();
  return defaultStore;
}

export function resetDefaultStore(): void {
  defaultStore = null;
}
