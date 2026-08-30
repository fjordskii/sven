import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getStore, type JournalStore } from "./journal-store";

export type AgentTokenRecord = {
  id: string;
  name: string;
  platform: string | null;
  hash: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

export type AgentTokenPublic = Omit<AgentTokenRecord, "hash">;

export type CreatedAgentToken = AgentTokenPublic & {
  token: string;
};

function pepper(): string {
  return (
    process.env.JOURNAL_TOKEN_PEPPER?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    "dev-only-not-for-production"
  );
}

export function hashToken(token: string): string {
  return createHmac("sha256", pepper()).update(token).digest("hex");
}

function hashesEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function generateTokenSecret(): string {
  return `sven_${randomBytes(24).toString("base64url")}`;
}

export function tokenPrefix(token: string): string {
  return token.slice(0, 12);
}

function toPublic(record: AgentTokenRecord): AgentTokenPublic {
  return {
    id: record.id,
    name: record.name,
    platform: record.platform,
    prefix: record.prefix,
    createdAt: record.createdAt,
    lastUsedAt: record.lastUsedAt,
    revokedAt: record.revokedAt,
  };
}

export async function listTokens(
  store: JournalStore = getStore(),
): Promise<AgentTokenPublic[]> {
  const doc = await store.load();
  return doc.tokens
    .filter((token) => !token.revokedAt)
    .map(toPublic)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function createToken(
  name: string,
  platform: string | null = null,
  store: JournalStore = getStore(),
): Promise<CreatedAgentToken> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Token name is required.");
  const token = generateTokenSecret();
  const stamp = new Date().toISOString();
  const record: AgentTokenRecord = {
    id: crypto.randomUUID(),
    name: trimmed.slice(0, 80),
    platform: platform?.trim() ? platform.trim().slice(0, 80) : null,
    hash: hashToken(token),
    prefix: tokenPrefix(token),
    createdAt: stamp,
    lastUsedAt: null,
    revokedAt: null,
  };

  await store.update((doc) => ({
    ...doc,
    tokens: [...doc.tokens, record],
  }));

  return { ...toPublic(record), token };
}

export async function revokeToken(
  id: string,
  store: JournalStore = getStore(),
): Promise<void> {
  const stamp = new Date().toISOString();
  await store.update((doc) => ({
    ...doc,
    tokens: doc.tokens.map((token) =>
      token.id === id && !token.revokedAt
        ? { ...token, revokedAt: stamp }
        : token,
    ),
  }));
}

export async function verifyAgentToken(
  token: string,
  store: JournalStore = getStore(),
): Promise<AgentTokenPublic | null> {
  const raw = token.trim();
  if (!raw.startsWith("sven_")) return null;
  const digest = hashToken(raw);
  const doc = await store.load();
  const match = doc.tokens.find(
    (record) => !record.revokedAt && hashesEqual(record.hash, digest),
  );
  if (!match) return null;

  const hourAgo = Date.now() - 60 * 60 * 1000;
  const last = match.lastUsedAt ? Date.parse(match.lastUsedAt) : 0;
  if (!match.lastUsedAt || last < hourAgo) {
    const stamp = new Date().toISOString();
    await store.update((current) => ({
      ...current,
      tokens: current.tokens.map((record) =>
        record.id === match.id ? { ...record, lastUsedAt: stamp } : record,
      ),
    }));
  }

  return toPublic(match);
}

export function parseBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(\S+)/i);
  return match?.[1] ?? null;
}
