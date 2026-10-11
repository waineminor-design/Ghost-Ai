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
  AI work runs. One task per file, each a named export with
  a typed payload: `design-agent` (`trigger/design-agent.ts`,
  `{ projectId, prompt, userId }`) and `spec-generator`
  (`trigger/spec-generator.ts`, `{ projectId, userId }`).
  Both are placeholders that log and return their input.
  App code triggers them by id with a type-only import
  (`tasks.trigger<typeof designAgent>("design-agent", ...)`),
  never by importing the task itself.
- `trigger.config.ts` (repo root) — Trigger.dev config:
  project ref from `TRIGGER_PROJECT_REF`, Node runtime,
  tasks in `./trigger`, max duration 3600 s, retries on by
  default (3 attempts, exponential backoff, also in dev).
  Its Prisma build extension (`modern` mode, for Prisma 7's
  `prisma-client` generator) keeps `@prisma/client`
  external; the generated client in `app/generated/prisma`
  is bundled like any other source. The CLI's bundler
  stubs `server-only`, so tasks can import the `lib/` data
  and storage modules. `.trigger/` (the CLI's local build
  state) is git-ignored.
- `components/ui/` — generated shadcn/ui components. Not
  edited by hand.
- `components/editor/`, `components/canvas/` and other
  feature folders — app-specific UI.
  `components/canvas/canvas-room.tsx` is the client entry
  point that joins a project's Liveblocks room;
  `components/canvas/canvas.tsx` is the React Flow canvas
  inside it. `components/canvas/collaborator-cursors.tsx`
  draws other users' cursors (Liveblocks' React Flow
  `<Cursors>`, `cursor` presence in flow coordinates).
  The navbar is outside the room, so the avatar stack
  (`components/editor/presence-avatars.tsx`) renders inside
  the room and is portaled into a navbar slot that
  `EditorShell` shares through `PresenceSlotContext`
  (`components/editor/presence-slot-context.ts`). The Save
  button (`components/editor/save-button.tsx`) works the
  same way: the canvas renders it, with the autosave
  status, into the slot from `SaveSlotContext`.
- `hooks/` — client hooks for dialog state, form state and
  mutations, canvas autosave (`use-canvas-autosave.ts`:
  debounced, on-click and on-leave saves of the canvas
  snapshot, one request at a time, with the Save button's
  status) and restore (`use-canvas-restore.ts`: loads the
  snapshot into an empty room once, through the flow), and
  the canvas actions (`use-canvas-actions.ts`:
  zoom, fit view, undo/redo through the Liveblocks room
  history) shared by the control bar and the keyboard
  shortcuts (`use-canvas-shortcuts.ts`), and the AI
  Architect chat's local state (`use-ai-chat.ts`, owned by
  the AI sidebar; no AI calls or persistence yet).
- `lib/` — shared utilities: `cn()`, Prisma client
  singleton, Liveblocks and Blob helpers. Database queries
  live in `server-only` data modules (e.g.
  `lib/project-data.ts`) that route handlers and server
  components both call. `lib/project-access.ts` resolves
  the signed-in identity and whether it may open a project
  (owner or collaborator). `lib/user-profiles.ts`
  (`server-only`) looks up Clerk profiles (name, avatar) for
  collaborator emails and the owner. `lib/collaborators.ts`
  holds the email rules (trim + lowercase, validation) and
  share response types used by both server and client.
  `lib/api-client.ts` is the client helper for calling the
  JSON route handlers. `lib/liveblocks.ts` (`server-only`)
  holds the cached Liveblocks Node client and
  `getUserColor()` (the cursor color palette).
  `lib/canvas-types.ts` holds the canvas node/edge types
  (`CanvasNode`, `CanvasEdge`, `CanvasNodeData`,
  `CanvasEdgeData`) and the edge type name
  (`LABELED_EDGE_TYPE`) — the one schema the canvas,
  storage, templates, AI generation and spec generation
  share. `lib/canvas-shapes.ts` is the one
  shape list (name, label, default size), the `shape` node
  type name, and the drag-and-drop payload
  (`application/ghost-shape`) with its parser.
  `lib/canvas-snapshot.ts` is the snapshot format
  (`{ version: 1, savedAt, nodes, edges }`), its validation
  and the stripping of local-only React Flow state
  (`selected`, `dragging`, `measured`, `resizing`); shared by
  the canvas route and the client. `lib/canvas-storage.ts`
  (`server-only`) reads and writes snapshots in the private
  Blob store. `lib/canvas-colors.ts` maps node color keys
  (`data.color`) to design-token classes; nodes store only
  the key. `lib/canvas-templates.ts` is the starter template
  library (`CANVAS_TEMPLATES`: ordinary `CanvasNode` /
  `CanvasEdge` lists) and `instantiateTemplate()`, which
  copies one with fresh ids. `hooks/use-template-import.ts`
  replaces the room's flow with a template in one
  Liveblocks mutation (one sync, one undo step) and fits
  the view.
- `liveblocks.config.ts` (repo root) — the global Liveblocks
  types (Presence, UserMeta, Storage); every Liveblocks hook
  and the Node client are typed from it.
- `prisma/` — Prisma schema, one file per model under
  `prisma/models/`, and migrations.
  `prisma.config.ts` (repo root) points the CLI at it and
  loads `DATABASE_URL` from `.env.local`.
- `app/generated/prisma/` — generated Prisma client
  (git-ignored, rebuilt by `postinstall`). Not edited by
  hand.
- `proxy.ts` — Clerk route protection. This is the Next.js
  16 name for middleware; do not create `middleware.ts`.
  `/api` routes are public in `proxy.ts` (the middleware
  still runs so `auth()` works); every route handler checks
  `auth()` itself and returns 401 JSON.

## Local Development

Local development needs two terminals, both in `ghost-ai/`:

1. `npm run dev` — the Next.js app.
2. `npm run trigger:dev` — the Trigger.dev dev worker
   (`trigger dev` — the CLI's command is `trigger`, not
   `trigger.dev`). It registers the tasks with the
   Trigger.dev project and runs them on this machine. The
   first run asks the CLI to log in to Trigger.dev.

The worker sees the same variables as the app: the CLI
loads `.env`, `.env.development`, `.env.local` and
`.env.development.local` from the project folder by
default, so `.env.local` needs no flag. If two of these
files set the same key, the CLI keeps the first one
(`.env`), while Next.js lets `.env.local` win; keep each
key in `.env.local` only. `TRIGGER_SECRET_KEY` is used by
the app to trigger tasks; the dev worker authenticates
with the CLI login instead.

Production: deployed tasks don't read `.env.local`. Their
environment variables (`DATABASE_URL`, Blob, Liveblocks and
AI keys) are set in the Trigger.dev dashboard for the
production environment as part of the deploy step, and the
app's `TRIGGER_SECRET_KEY` on Vercel is the production key.

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
  database stores only the reference/URL. The store is
  private: blobs are written with `access: "private"` and
  read on the server with `BLOB_READ_WRITE_TOKEN`; no Blob
  URL or token reaches the browser.
  - Canvas snapshot: one per project at
    `canvas/<projectId>.json` (overwritten on every save),
    `{ version: 1, savedAt, nodes, edges }`; its path is in
    `Project.canvasJsonPath`. `PUT` / `GET
    /api/projects/[projectId]/canvas` save and read it for
    the owner and collaborators (body ≤ 2 MB). The canvas
    autosaves it ~3 s after a change, on `Save`, and when
    the page is hidden or left; an empty room is filled
    from it once on load. Liveblocks stays the live source
    of truth; the snapshot is the copy AI and spec
    generation read.
- **Liveblocks room storage**: live canvas state (nodes,
  edges) and presence during a session. The room id stays
  aligned with the project id. Storage holds one key,
  `flow` (`LiveblocksFlow<CanvasNode, CanvasEdge>`), the
  shape `useLiveblocksFlow` from `@liveblocks/react-flow`
  syncs; a new room starts with an empty flow.

## Auth and Access Model

- Every user signs in via Clerk. Routes are protected in
  `proxy.ts`; public and protected routes are declared
  explicitly (Clerk leaves routes public by default).
- Every project has exactly one owner (the creator's Clerk
  user id).
- The owner can add collaborators by email. Collaborators
  can open and edit the canvas; only the owner can rename,
  delete or manage collaborators.
- Collaborator emails are stored trimmed and lowercased and
  matched against the user's primary Clerk email. Collaborator
  routes return 404 to users without access (the project's
  existence is not revealed) and 403 to collaborators for
  owner-only actions.
- A Liveblocks room token is issued only after verifying
  that the requesting user is the owner or a collaborator
  of that project. `POST /api/liveblocks-auth` uses access
  tokens (`prepareSession`): full access (`*:write`) to
  exactly the requested room (= project id), never a
  wildcard pattern. Liveblocks user id = Clerk user id;
  user info = name, avatar, color.
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
