# Code Standards

## General

- Keep modules small and single-purpose.
- Fix root causes; do not layer workarounds.
- Do not mix unrelated concerns in one component or route.
- Follow the patterns already in the codebase so feature 16
  looks like feature 5.

## TypeScript

- Strict mode is required throughout the project.
- Avoid `any` — use explicit interfaces or narrowly scoped
  types.
- Validate unknown external input (request bodies, AI
  output, Blob/JSON reads) at system boundaries before
  trusting it.
- Share canvas node/edge types from one place; do not
  redefine them per feature.

## Next.js

- This is Next.js 16. Read the relevant guide in
  `node_modules/next/dist/docs/` before writing framework
  code; do not rely on Next.js 14/15 habits.
- Use `proxy.ts`, not `middleware.ts`.
- Default to server components.
- Add `'use client'` only when browser interactivity
  requires it, and only on entry points rendered by server
  components.
- Load initial data on the server; no client-side fetching
  for the initial page load.
- Keep route handlers focused on a single responsibility.

## Styling

- Use the design tokens from `app/globals.css` through
  Tailwind utility names (`bg-background`,
  `text-muted-foreground`, `border-border`, ...).
- No raw Tailwind color classes (`bg-zinc-900`) and no
  hardcoded hex/oklch values in components.
- Follow the radius scale and layout patterns in
  `ui-context.md`.
- Use `cn()` from `@/lib/utils` to merge class names.

## API Routes

- Validate and parse request input before any logic runs.
- Enforce auth (Clerk) and project ownership/membership
  before any read of private data or any mutation.
- Return consistent, predictable response shapes and
  proper status codes.
- Never run long AI work in a route handler — trigger a
  Trigger.dev task and return.

## Data and Storage

- Metadata belongs in Postgres via Prisma.
- Large generated content (canvas snapshots, specs) belongs
  in Vercel Blob; store only the reference in Postgres.
- Use the cached Prisma client singleton from
  `lib/prisma.ts`; never instantiate Prisma per request.
- Do not add schema fields that a spec does not require.

## File Organization

- `app/` — routes, layouts, pages
- `app/api/` — route handlers
- `components/ui/` — generated shadcn/ui components
  (do not edit)
- `components/<feature>/` — feature components
  (e.g. `editor/`, `canvas/`)
- `hooks/` — client hooks
- `lib/` — shared utilities and clients
- `prisma/` — schema, models, migrations
- `trigger/` — Trigger.dev background tasks
