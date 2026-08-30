import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AgentTokenRecord } from "./agent-tokens";
import type { WorkItem } from "./journal";

export type StoreDoc = {
  version: 1;
  items: WorkItem[];
  tokens: AgentTokenRecord[];
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

const BLOB_PATH = "sven/journal.json";

let overrideStore: JournalStore | null = null;
let defaultStore: JournalStore | null = null;

export function emptyDoc(): StoreDoc {
  return { version: 1, items: [], tokens: [] };
}

export function setStoreForTests(store: JournalStore | null): void {
  overrideStore = store;
}

export function createMemoryStore(initial?: Partial<StoreDoc>): JournalStore {
  let doc: StoreDoc = {
    ...emptyDoc(),
    ...initial,
    items: initial?.items ? [...initial.items] : [],
    tokens: initial?.tokens ? [...initial.tokens] : [],
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
    tokens: [...doc.tokens],
  };
}

function parseDoc(raw: string): StoreDoc {
  const parsed = JSON.parse(raw) as Partial<StoreDoc>;
  return {
    version: 1,
    items: Array.isArray(parsed.items) ? (parsed.items as WorkItem[]) : [],
    tokens: Array.isArray(parsed.tokens)
      ? (parsed.tokens as AgentTokenRecord[])
      : [],
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
      return parseDoc(raw);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return emptyDoc();
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
  const { get, put } = await import("@vercel/blob");
  const { BlobNotFoundError, BlobPreconditionFailedError } = await import(
    "@vercel/blob"
  );

  async function read(): Promise<{ doc: StoreDoc; etag?: string }> {
    const result = await get(BLOB_PATH, {
      access: "private",
      useCache: false,
    });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return { doc: emptyDoc() };
    }
    const text = await new Response(result.stream).text();
    return { doc: parseDoc(text), etag: result.blob.etag };
  }

  async function write(doc: StoreDoc, etag?: string): Promise<void> {
    await put(BLOB_PATH, `${JSON.stringify(doc)}\n`, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
      ...(etag ? { ifMatch: etag } : {}),
    });
  }

  return {
    kind: "blob",
    async load() {
      try {
        const { doc } = await read();
        return cloneDoc(doc);
      } catch (error) {
        if (error instanceof BlobNotFoundError) return emptyDoc();
        throw error;
      }
    },
    async update(fn) {
      let lastError: unknown;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        let etag: string | undefined;
        let current: StoreDoc;
        try {
          const loaded = await read();
          current = loaded.doc;
          etag = loaded.etag;
        } catch (error) {
          if (error instanceof BlobNotFoundError) {
            current = emptyDoc();
          } else {
            throw error;
          }
        }
        const next = fn(cloneDoc(current));
        try {
          await write(next, etag);
          return cloneDoc(next);
        } catch (error) {
          lastError = error;
          if (error instanceof BlobPreconditionFailedError) {
            continue;
          }
          throw error;
        }
      }
      throw lastError instanceof Error
        ? lastError
        : new Error("Journal write conflict. Try again.");
    },
  };
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
    // Lazy: first call creates the blob store. Cache the promise-backed wrapper.
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
