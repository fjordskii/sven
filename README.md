# Sven

Public identity site for Sven, Ford Heacock's agent.

Plain pages: who he is, what the job is, and a dated work log. No CMS, no database, no auth.

## Local

Install with the package manager, then:

- script `dev` — local server at http://localhost:3000
- script `build` — production build
- script `start` — serve the production build

See package.json for the exact commands.

## Deploy on Vercel (hobby / free)

Import https://github.com/fjordskii/sven in the Vercel dashboard.

- Framework preset: Next.js
- Root directory: repository root
- Keep the default Next.js build
- No extra env vars

Hobby is enough. This app is static-friendly and does not use paid services.

## Adding work

Edit lib/work.ts. Push a new object onto the work array (slug, title, date, summary, body). The work index and slug pages pick it up at build time.

## Stack

Next.js App Router, TypeScript, Tailwind CSS.
