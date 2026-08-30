import type {
  AuthCodeRecord,
  OAuthClient,
  RefreshRecord,
} from "./oauth";
import { getStore, type JournalStore } from "./journal-store";

export async function saveClient(
  client: OAuthClient,
  store: JournalStore = getStore(),
): Promise<void> {
  await store.update((doc) => ({
    ...doc,
    oauthClients: [
      ...doc.oauthClients.filter((item) => item.client_id !== client.client_id),
      client,
    ],
  }));
}

export async function getClient(
  clientId: string,
  store: JournalStore = getStore(),
): Promise<OAuthClient | undefined> {
  const doc = await store.load();
  return doc.oauthClients.find((client) => client.client_id === clientId);
}

export async function saveAuthCode(
  record: AuthCodeRecord,
  store: JournalStore = getStore(),
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await store.update((doc) => ({
    ...doc,
    oauthCodes: [
      ...doc.oauthCodes.filter((item) => item.expiresAt > now),
      record,
    ],
  }));
}

export async function consumeAuthCode(
  codeHash: string,
  store: JournalStore = getStore(),
): Promise<AuthCodeRecord | null> {
  const now = Math.floor(Date.now() / 1000);
  let found: AuthCodeRecord | null = null;
  await store.update((doc) => {
    const match = doc.oauthCodes.find((item) => item.code_hash === codeHash);
    if (match && match.expiresAt > now) found = match;
    return {
      ...doc,
      oauthCodes: doc.oauthCodes.filter(
        (item) => item.code_hash !== codeHash && item.expiresAt > now,
      ),
    };
  });
  return found;
}

export async function saveRefreshToken(
  record: RefreshRecord,
  store: JournalStore = getStore(),
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await store.update((doc) => ({
    ...doc,
    oauthRefresh: [
      ...doc.oauthRefresh.filter((item) => item.expiresAt > now),
      record,
    ],
  }));
}

export async function consumeRefreshToken(
  tokenHash: string,
  store: JournalStore = getStore(),
): Promise<RefreshRecord | null> {
  const now = Math.floor(Date.now() / 1000);
  let found: RefreshRecord | null = null;
  await store.update((doc) => {
    const match = doc.oauthRefresh.find((item) => item.token_hash === tokenHash);
    if (match && match.expiresAt > now) found = match;
    return {
      ...doc,
      oauthRefresh: doc.oauthRefresh.filter(
        (item) => item.token_hash !== tokenHash && item.expiresAt > now,
      ),
    };
  });
  return found;
}

export async function revokeRefreshToken(
  tokenHash: string,
  store: JournalStore = getStore(),
): Promise<void> {
  await store.update((doc) => ({
    ...doc,
    oauthRefresh: doc.oauthRefresh.filter((item) => item.token_hash !== tokenHash),
  }));
}
