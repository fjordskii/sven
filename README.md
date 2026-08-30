# Sven

Identity site for Sven, Ford Heacock's agent.

Plain pages: who he is, what the job is, and a dated work log. The site is
gated with Google OAuth (Auth.js). Only one email can view it.

## Local

Copy `.env.example` to `.env.local` and fill in the Auth.js variables (see
below). Then install and:

- script `dev` — local server at http://localhost:3000
- script `build` — production build
- script `start` — serve the production build

See package.json for the exact commands.

## Auth (Google OAuth)

The app uses [Auth.js](https://authjs.dev) (`next-auth` v5) with the Google
provider. This is application-level auth. Do **not** turn on Vercel
Deployment Protection / Vercel Authentication for this project; that SSO is a
different gate and is not what we want.

Anyone who is not signed in is sent to `/sign-in`, then back to the page they
asked for. Google accounts other than the owner are denied. Auth endpoints
(`/api/auth/*`) and the sign-in / denied pages stay reachable.

### Environment variables

Set these in `.env.local` for development and in the Vercel project
(Production, and Preview if you will test OAuth there).

| Name | Required | Notes |
| --- | --- | --- |
| `AUTH_SECRET` | yes | Random string used to encrypt the session cookie. Generate with `npx auth secret`. |
| `AUTH_GOOGLE_ID` | yes | Google Cloud OAuth 2.0 client ID. |
| `AUTH_GOOGLE_SECRET` | yes | Google Cloud OAuth 2.0 client secret. |
| `AUTH_URL` | no | Full origin, e.g. `http://localhost:3000` or `https://<deployment>.vercel.app`. Auth.js infers this on Vercel from the request host (`trustHost`). Set it locally if callbacks go to the wrong origin. |
| `AUTH_ALLOWED_EMAIL` | no | Only this Google email may view the site (case-insensitive). Defaults to `fordheacock@gmail.com`. |

Do not commit secrets. `.env*` is gitignored except `.env.example`.

### Google Cloud OAuth client

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
create an OAuth 2.0 Client ID of type **Web application**.

Auth.js callback path is always `/api/auth/callback/google`.

**Authorized JavaScript origins**

- `http://localhost:3000`
- `https://<production-host>.vercel.app` (the current Vercel production URL)

**Authorized redirect URIs**

- `http://localhost:3000/api/auth/callback/google`
- `https://<production-host>.vercel.app/api/auth/callback/google`

There is no custom domain yet. Use the exact `*.vercel.app` hostname from the
Vercel project (Project → Settings → Domains). Google does not allow wildcard
redirect URIs, so each Preview deployment hostname must be added separately if
you need Google sign-in on that preview.

After creating the client, put the client ID and secret in `AUTH_GOOGLE_ID`
and `AUTH_GOOGLE_SECRET`, then redeploy.

### Disable Vercel Authentication

In the Vercel project: Settings → Deployment Protection. Turn off **Vercel
Authentication** (the vercel.com/login SSO). The app gate is Auth.js, not
platform SSO.

## Deploy on Vercel (hobby / free)

Import https://github.com/fjordskii/sven in the Vercel dashboard.

- Framework preset: Next.js
- Root directory: repository root
- Keep the default Next.js build
- Add the env vars above (Hobby is enough; no paid auth product)

## Adding work

Edit lib/work.ts. Push a new object onto the work array (slug, title, date,
summary, body). The work index and slug pages pick it up at build time.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Auth.js (Google).
