# Sven

Ford Heacock's home base: a private Kanban + calendar, and a remote MCP
server that agents authorize through Google OAuth.

`/about` and `/work` stay as they were. Signed-in home is the board. The
site is gated with Google OAuth (Auth.js). Only one email can view it or
approve an MCP client.

## Local

Copy `.env.example` to `.env.local` and fill in the Auth.js variables (see
below). Then install and:

- script `dev` — local server at http://localhost:3000
- script `build` — production build
- script `start` — serve the production build
- script `test` — journal, OAuth, and allowlist unit tests

Without Vercel Blob, the journal writes JSON under `.data/` (gitignored).

## Auth (Google for humans, and for MCP consent)

The app uses [Auth.js](https://authjs.dev) (`next-auth` v5) with the Google
provider. This is the only login. MCP clients do **not** get a pasted API
token. They run OAuth 2.1 against this app; Ford signs in with the same
Google account and approves the client. After consent, the authorization
server issues a short-lived access token (and refresh token) for `/mcp`.

Do **not** turn on Vercel Deployment Protection / Vercel Authentication.
That SSO would block both Google sign-in and the MCP OAuth endpoints.

### Environment variables

| Name | Required | Notes |
| --- | --- | --- |
| `AUTH_SECRET` | yes | Session cookie + signing key for MCP access tokens. `npx auth secret`. |
| `AUTH_GOOGLE_ID` | yes | Google Cloud OAuth 2.0 client ID. |
| `AUTH_GOOGLE_SECRET` | yes | Google Cloud OAuth 2.0 client secret. |
| `AUTH_URL` | recommended in production | Stable origin, e.g. `https://sven-fjordskiis-projects.vercel.app`. Used as the OAuth issuer. |
| `AUTH_ALLOWED_EMAIL` | no | Only this Google email may view the site or approve MCP clients. Defaults to `fordheacock@gmail.com`. |
| `JOURNAL_TZ` | no | Timezone for today / coming-days. Defaults to `America/New_York`. |
| `JOURNAL_DATA_DIR` | no | Local JSON directory when Blob is not configured. Defaults to `.data`. |
| `BLOB_READ_WRITE_TOKEN` | production | Injected when you create and connect a Vercel Blob store. |

### Google Cloud OAuth client — extra origins Ford must add

Auth.js callback path is always `/api/auth/callback/google`. MCP clients
never talk to Google directly; they talk to this app, which then uses the
existing Google session.

**Authorized JavaScript origins**

- `http://localhost:3000`
- `https://sven-fjordskiis-projects.vercel.app`
- `https://sven-beige.vercel.app` (older production host, if still in use)

**Authorized redirect URIs**

- `http://localhost:3000/api/auth/callback/google`
- `https://sven-fjordskiis-projects.vercel.app/api/auth/callback/google`
- `https://sven-beige.vercel.app/api/auth/callback/google`

Google does not allow wildcard redirect URIs. Add each Preview
`*.vercel.app` hostname separately if that preview needs Google sign-in.

### Disable Vercel Authentication

**Settings → Deployment Protection → Vercel Authentication: off.**

The gates are Google (humans + MCP consent) and OAuth access tokens
(agents). If platform SSO stays on, agents cannot complete discovery or
the token exchange.

## Storage (Vercel Blob, Hobby)

Journal items and OAuth client/code/refresh rows persist in a **private**
Vercel Blob object. Blob has a free allowance on Hobby.

**Create the store once:**

1. Open [sven on Vercel](https://vercel.com/fjordskiis-projects/sven)
2. Sidebar → **Storage**
3. **Create Database** → **Blob**
4. Access: **Private**
5. Name: `sven-journal`
6. Connect to **Production** (and Preview / Development if you want)
7. Create, then **redeploy**

## Remote MCP (OAuth 2.1)

Production MCP URL:

```
https://sven-fjordskiis-projects.vercel.app/mcp
```

Local: `http://localhost:3000/mcp`

This app is both the MCP resource server and the authorization server.

| Endpoint | Role |
| --- | --- |
| `/mcp` | Streamable HTTP MCP. Bearer access token required. |
| `/.well-known/oauth-protected-resource` | RFC 9728 Protected Resource Metadata |
| `/.well-known/oauth-authorization-server` | RFC 8414 Authorization Server Metadata |
| `/oauth/register` | Dynamic Client Registration (RFC 7591, fallback) |
| `/oauth/authorize` | Authorization code + PKCE. Requires Google (allowlist). |
| `/oauth/token` | Code and refresh-token exchange |
| `/oauth/revoke` | Refresh-token revocation |

`client_id_metadata_document_supported` is advertised for CIMD. DCR remains
for clients that still register that way. After Ford consents with
`fordheacock@gmail.com`, the server issues an access token. That token is
an internal OAuth credential — not a secret Ford pastes into agents.

### Add in Cursor

Cursor Settings → MCP → add a remote HTTP server. Point it at the URL only.
Cursor should start the OAuth flow (401 → PRM → authorize in a browser →
token). Do **not** add a static `Authorization` header.

```json
{
  "mcpServers": {
    "sven-journal": {
      "url": "https://sven-fjordskiis-projects.vercel.app/mcp"
    }
  }
}
```

When the browser opens, sign in with the owner Google account and click
**Approve**.

### Generic MCP HTTP client

Any Streamable HTTP client (ChatGPT custom MCP, Claude, Grok, cloud agents):

- **URL:** `https://sven-fjordskiis-projects.vercel.app/mcp`
- **Auth:** OAuth 2.1 (PKCE). Follow Protected Resource Metadata.
- Do not paste a bearer token as the primary setup.

Stdio-only clients can wrap the URL with `mcp-remote`; the wrapper still
needs to complete the OAuth redirect.

### Tools

| Tool | Purpose |
| --- | --- |
| `list_board` | In progress / left to do / done |
| `get_today_upcoming` | Today plus coming days |
| `publish_item` | Create or replace an item |
| `update_item` | Change title, notes, status, or due date |
| `mark_done` | Close an item |
| `add_note` | Append a dated note |

Statuses: `in_progress` / `in_flight`, `next` / `left_to_do`, `done`.
Due date field: `due_date` or `for_date` (`YYYY-MM-DD`).

## Public work log

`/work` is still the dated public log in `lib/work.ts`. Separate from the
private board.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Auth.js (Google), Vercel Blob,
MCP Streamable HTTP, OAuth 2.1 on this same app.
