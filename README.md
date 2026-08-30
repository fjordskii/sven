# Sven

Ford Heacock's home base: a private ops journal plus a remote MCP server
that any of his agents can authenticate into and publish to.

The public-facing `/about` and `/work` pages stay as they were. Signed-in
home is the journal. The site is gated with Google OAuth (Auth.js). Only
one email can view it. Agents do not use Google — they use a bearer token.

## Local

Copy `.env.example` to `.env.local` and fill in the Auth.js variables (see
below). Then install and:

- script `dev` — local server at http://localhost:3000
- script `build` — production build
- script `start` — serve the production build
- script `test` — journal, token, and allowlist unit tests

See package.json for the exact commands.

Without Vercel Blob, the journal writes JSON under `.data/` (gitignored).
That is enough for local development.

## Auth (Google for humans)

The app uses [Auth.js](https://authjs.dev) (`next-auth` v5) with the Google
provider. This is application-level auth. Do **not** turn on Vercel
Deployment Protection / Vercel Authentication for this project; that SSO is a
different gate and would block both Google sign-in and MCP tokens.

Anyone who is not signed in is sent to `/sign-in`, then back to the page they
asked for. Google accounts other than the owner are denied. Auth endpoints
(`/api/auth/*`), the sign-in / denied pages, and `/mcp` stay reachable. `/mcp`
still requires a valid agent bearer token.

### Environment variables

Set these in `.env.local` for development and in the Vercel project
(Production, and Preview if you will test OAuth there).

| Name | Required | Notes |
| --- | --- | --- |
| `AUTH_SECRET` | yes | Random string used to encrypt the session cookie and, by default, HMAC-hash agent tokens. Generate with `npx auth secret`. |
| `AUTH_GOOGLE_ID` | yes | Google Cloud OAuth 2.0 client ID. |
| `AUTH_GOOGLE_SECRET` | yes | Google Cloud OAuth 2.0 client secret. |
| `AUTH_URL` | no | Full origin, e.g. `http://localhost:3000` or `https://sven-beige.vercel.app`. Auth.js infers this on Vercel from the request host (`trustHost`). Set it locally if callbacks go to the wrong origin. |
| `AUTH_ALLOWED_EMAIL` | no | Only this Google email may view the site (case-insensitive). Defaults to `fordheacock@gmail.com`. |
| `JOURNAL_TOKEN_PEPPER` | no | Optional extra HMAC pepper for agent tokens. Falls back to `AUTH_SECRET`. |
| `JOURNAL_TZ` | no | Timezone for today / coming-days. Defaults to `America/New_York`. |
| `JOURNAL_DATA_DIR` | no | Local JSON directory when Blob is not configured. Defaults to `.data`. |
| `BLOB_READ_WRITE_TOKEN` | production | Injected when you create and connect a Vercel Blob store. Required on Vercel so the journal persists across deploys. |

Do not commit secrets. `.env*` is gitignored except `.env.example`.

### Google Cloud OAuth client

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
create an OAuth 2.0 Client ID of type **Web application**.

Auth.js callback path is always `/api/auth/callback/google`.

**Authorized JavaScript origins**

- `http://localhost:3000`
- `https://sven-beige.vercel.app` (current production host)

**Authorized redirect URIs**

- `http://localhost:3000/api/auth/callback/google`
- `https://sven-beige.vercel.app/api/auth/callback/google`

There is no custom domain yet. Use the exact `*.vercel.app` hostname from the
Vercel project (Project → Settings → Domains). Google does not allow wildcard
redirect URIs, so each Preview deployment hostname must be added separately if
you need Google sign-in on that preview.

After creating the client, put the client ID and secret in `AUTH_GOOGLE_ID`
and `AUTH_GOOGLE_SECRET`, then redeploy.

### Disable Vercel Authentication

In the Vercel project: **Settings → Deployment Protection**. Turn **off**
**Vercel Authentication** (the vercel.com/login SSO). The gates are Google
(humans) and MCP bearer tokens (agents), not platform SSO. If Vercel
Authentication stays on, external agents cannot reach `/mcp`.

## Storage (Vercel Blob, Hobby)

The journal and hashed tokens persist in a **private** Vercel Blob object
(`sven/journal.json`). Blob has a free allowance on Hobby. This is
first-party Vercel storage, not a paid auth/db product.

**Ford must create the store once:**

1. Open the project: [sven on Vercel](https://vercel.com/fjordskiis-projects/sven)
2. Sidebar → **Storage**
3. **Create Database**
4. Choose **Blob**
5. Set access to **Private** (this cannot be changed later)
6. Name it something like `sven-journal`
7. Connect it to **Production** (and **Preview** / **Development** if you want those environments to share or have their own store)
8. Create, then **redeploy** so `BLOB_READ_WRITE_TOKEN` is available to the app

Until that store exists, the signed-in journal shows a setup note. Local
`next dev` without Blob uses `.data/journal.json`.

## Remote MCP

Production MCP URL:

```
https://sven-beige.vercel.app/mcp
```

Local:

```
http://localhost:3000/mcp
```

Streamable HTTP (MCP spec 2026-07-28, with a 2025-era fallback). Agents
authenticate with `Authorization: Bearer <token>`. Missing or invalid tokens
are rejected with `401`. Humans keep Google; agents never use Google OAuth.

Mint and revoke tokens on the signed-in journal (shown once, HMAC-hashed at
rest). Token names and platforms become the default `source` on items that
agent publishes.

### Tools

| Tool | Purpose |
| --- | --- |
| `list_board` | In-flight / next / done. Start a session here. |
| `get_today_upcoming` | Today plus coming days, derived from dates and in-flight work. |
| `publish_item` | Create (or replace by id) an item. Use when you start, finish, or assign Ford a next step. |
| `update_item` | Change title, notes, status, or date. |
| `mark_done` | Close an item, optional closing note. |
| `add_note` | Append a dated note without changing status. |

Tool descriptions tell calling agents to report work they started, finished,
or that Ford needs to do next.

### Add in Cursor

Cursor Settings → MCP → add a remote / HTTP server:

```json
{
  "mcpServers": {
    "sven-journal": {
      "url": "https://sven-beige.vercel.app/mcp",
      "headers": {
        "Authorization": "Bearer sven_…your-token…"
      }
    }
  }
}
```

In `mcp.json` the shape is the same: a URL plus an `Authorization` header.
Do not commit the token.

### Generic MCP HTTP client

Any Streamable HTTP client (ChatGPT custom MCP, Claude, Grok Bot, cloud
agents, `mcp-remote`):

- URL: `https://sven-beige.vercel.app/mcp`
- Header: `Authorization: Bearer <token>`
- Method: POST JSON-RPC (`initialize`, `tools/list`, `tools/call`)

Stdio-only clients can wrap it:

```json
{
  "sven-journal": {
    "command": "npx",
    "args": ["-y", "mcp-remote", "https://sven-beige.vercel.app/mcp", "--header", "Authorization: Bearer sven_…"]
  }
}
```

## Deploy on Vercel (hobby / free)

Import https://github.com/fjordskii/sven in the Vercel dashboard.

- Framework preset: Next.js
- Root directory: repository root
- Keep the default Next.js build
- Add the Auth.js env vars
- Create the private Blob store (steps above)
- Keep Vercel Authentication **off**

Hobby is enough. No paid auth or database product.

## Public work log

`/work` is still the dated public log. Edit `lib/work.ts` and push a new
object onto the work array (slug, title, date, summary, body). That is
separate from the private journal.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Auth.js (Google), Vercel Blob,
MCP Streamable HTTP (`mcp-handler` + `@modelcontextprotocol/server`).
