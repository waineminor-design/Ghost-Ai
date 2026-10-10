# Architecture Context

## Stack

| Layer           | Technology                                      | Role                                                         |
| --------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| Framework       | Next.js 16 (App Router) + React 19 + TypeScript | Routing, server components, route handlers                   |
| UI              | Tailwind CSS v4 + shadcn/ui + Lucide React      | Styling via design tokens, base components, icons            |
| Auth            | Clerk                                           | User identity, sign-in/up, route protection (`proxy.ts`)     |
| Database        | Prisma + PostgreSQL                             | Project and collaborator metadata                            |
| Canvas          | React Flow                                      | Node/edge diagram editor                                     |
| Realtime        | Liveblocks                                      | Shared canvas state, presence, cursors, comments             |
| Background jobs | Trigger.dev                                     | Long-running AI tasks with retries and realtime status       |
| AI              | Vercel AI SDK + Google Gemini                   | Design generation and spec generation (inside Trigger tasks) |
| File storage    | Vercel Blob                                     | Canvas snapshots (JSON) and generated specs (Markdown)       |
| Hosting         | Vercel                                          | Production deployment                                        |

## System Boundaries

All app code lives in `ghost-ai/` (the git repository);
paths below are relative to it.

- `CONTEXT/` — the six context files and
  `CONTEXT/FEATURE-SPECS/`. Documentation only; no app code.
- `app/` — routes, layouts and pages. Server components by
  default.
- `app/api/` — route handlers. Validate input, enforce auth
  and ownership, read/write metadata, issue Liveblocks
  tokens, and trigger background tasks. Never run long AI
  work.
- `trigger/` — Trigger.dev task definitions (AI design
  generation, spec generation). The only place long-running
  AI work runs.
- `components/ui/` — generated shadcn/ui components. Not
  edited by hand.
- `components/editor/`, `components/canvas/` and other
  feature folders — app-specific UI.
- `hooks/` — client hooks for dialog state, form state and
  mutations.
- `lib/` — shared utilities: `cn()`, Prisma client
  singleton, Liveblocks and Blob helpers.
- `prisma/` — Prisma schema, one file per model under
  `prisma/models/`, and migrations.
- `proxy.ts` — Clerk route protection. This is the Next.js
  16 name for middleware; do not create `middleware.ts`.

## Storage Model

Hybrid storage. The database stays lean.

- **PostgreSQL (Prisma)**: metadata only.
  - `Project`: id, ownerId (Clerk user id), name, optional
    description, status (`DRAFT` | `ARCHIVED`), canvas JSON
    path (pointer to the Blob snapshot), timestamps.
    Indexed on ownerId and createdAt.
  - `ProjectCollaborator`: project relation (cascade
    delete), collaborator email, timestamp. Unique on
    (project, email); indexed for lookups.
- **Vercel Blob**: large artifacts — canvas snapshots
  (JSON) and generated specifications (Markdown). The
  database stores only the reference/URL.
- **Liveblocks room storage**: live canvas state (nodes,
  edges) and presence during a session. The room id stays
  aligned with the project id.

## Auth and Access Model

- Every user signs in via Clerk. Routes are protected in
  `proxy.ts`; public and protected routes are declared
  explicitly (Clerk leaves routes public by default).
- Every project has exactly one owner (the creator's Clerk
  user id).
- The owner can add collaborators by email. Collaborators
  can open and edit the canvas; only the owner can rename,
  delete or manage collaborators.
- A Liveblocks room token is issued only after verifying
  that the requesting user is the owner or a collaborator
  of that project.
- Background task status/tokens are scoped to the user who
  started the run.

## Invariants

1. Request handlers do not run long-lived AI work — that
   belongs in Trigger.dev background tasks.
2. Metadata (Postgres) and large artifacts (Vercel Blob)
   are stored in separate layers; no large JSON or Markdown
   in the database.
3. Auth and ownership are enforced at every mutation
   boundary.
4. Project membership is verified before any Liveblocks
   token is issued.
5. Client components are used only when browser
   interactivity requires it.
6. The canvas node/edge schema stays consistent across the
   canvas, templates, AI generation and spec generation.
7. Realtime goes through Liveblocks — no custom WebSocket
   implementation.
