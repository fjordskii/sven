# Sven: Needs Ford

`sven.fordheacock.com` is a small, Linear-style list of the things the agents
are blocked on Ford for. Ford signs in, sees what needs him, replies or marks
items done. Agents create, update, and close items through a JSON API.

This replaced the earlier Sven kanban/MCP site (see git history before the
`ford-blockers-tracker` PR).

## Stack

Next.js App Router on Vercel, Neon Postgres (`ford-blockers-db`, via the
Vercel Neon integration), no ORM. Tables are created on first use.

## Auth

- **Ford (UI):** single-owner password login. `OWNER_PASSWORD` is checked
  with a constant-time compare; success sets an httpOnly, Secure, SameSite=Lax
  cookie signed with `SESSION_SECRET` (30 days). Every page redirects to
  `/login` without it.
- **Agents (API):** `Authorization: Bearer $AGENT_API_TOKEN`. Anything else
  returns 401.

## Env

| Name | Notes |
| --- | --- |
| `DATABASE_URL` | Set by the Neon integration |
| `OWNER_PASSWORD` | Sensitive |
| `SESSION_SECRET` | Sensitive, long random |
| `AGENT_API_TOKEN` | Sensitive, long random |

## API

| Method | Path | Body |
| --- | --- | --- |
| GET | `/api/items?status=needs_you\|done\|all` | |
| POST | `/api/items` | `{title, ask, product?, why?, priority?, link?, key?, opened_at?, note?}` |
| GET | `/api/items/:id` | |
| PATCH | `/api/items/:id` | any field above, `status`, `resolve: true`, `note` |

`product`: TrackOutline, Deal Score, ARCF, YouTube, dollar, Other.
`priority`: urgent, normal, low. `status`: needs_you, done.
A POST with a `key` that already exists returns the existing item (200)
instead of creating a duplicate.

## Scripts

`npm run dev`, `npm run build`, `npm test`, `npm run lint`.
