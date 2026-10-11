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
  work. `POST /api/ai/design` starts a `design-agent` run
  (records a `TaskRun` row, then triggers, then stores the
  run id; passes the signed-in user's name as
  `startedByName`); `POST /api/ai/runs/[runId]/token` returns a
  Trigger.dev public token that can read only that run.
- `trigger/` — Trigger.dev task definitions (AI design
  generation, spec generation). The only place long-running
  AI work runs. One task per file, each a named export with
  a typed payload: `design-agent` (`trigger/design-agent.ts`,
  `{ projectId, prompt, userId, startedByName? }`) and `spec-generator`
  (`trigger/spec-generator.ts`, `{ projectId, userId }`).
  `spec-generator` is still a placeholder that logs and
  returns its input. App code triggers them by id with a
  type-only import
  (`tasks.trigger<typeof designAgent>("design-agent", ...)`),
  never by importing the task itself.
- The design agent (`design-agent`, feature 24) reads the
  room's nodes and edges with the Liveblocks Node client
  (`lib/design-agent-canvas.ts`), sends Gemini a compact
  description of them plus the prompt (model id in the
  `DESIGN_AGENT_MODEL` constant in the task file; key
  `GOOGLE_GENERATIVE_AI_API_KEY`), and gets back tool calls,
  one per canvas action (`lib/design-agent-tools.ts`:
  `addNode`, `updateNode`, `moveNode`, `resizeNode`,
  `deleteNode`, `addEdge`, `updateEdge`, `deleteEdge`; the
  system prompt is `lib/design-agent-prompt.ts`). The tools
  have no `execute`: the task validates the calls against
  the room as it is at apply time and applies the valid ones
  in one `mutateFlow()` call (`@liveblocks/react-flow/node`,
  the same storage format as the canvas's
  `useLiveblocksFlow`), so the change syncs to everyone at
  once (`lib/design-agent-actions.ts`). New nodes use the
  `shape` node type and get canvas-style ids
  (`<shape>-<time>-<n>-<random>`); new edges are `labeled`
  edges with React Flow's connection id
  (`xy-edge__<source><handle>-<target><handle>`), so a
  connection can't be added twice. `addNode` takes a short
  `key`; other calls in the same response can reference a
  node by that key or by an existing id. Invalid actions
  (unknown id/key, a key used twice or equal to an existing
  id, unknown shape/color, size below the 60x40 minimum,
  self-edges, duplicate connections, calls that don't match
  the schema) are skipped, not fatal. Returns
  `{ actionsApplied, summary }`.
  - Presence: while it runs, the agent is in the room as
    `AI_USER` (`lib/ai-user.ts`, shared with the client: id
    `ghost-ai`, name "Ghost AI") with `isThinking: true` and a cursor near
    where it works (`lib/design-agent-presence.ts`). It is
    set through the REST API with a 60 s TTL, refreshed
    every 20 s, and cleared (TTL 2 s, the minimum) when the
    run ends or fails.
  - Status messages: run metadata, read with Trigger.dev
    realtime through the run token. `status` is the latest
    `{ step, message, at }` (types `DesignAgentStatus` /
    `DesignAgentStep` in the task file; `at` is an ISO
    time) and `statusLog` lists every one in order. Steps:
    `started`, `thinking`, `applying` (message names the
    number of changes), `done` (message is the summary),
    `failed`. A retried attempt starts again at `started`;
    the run's own status says whether it finally succeeded.
    A fallback to the next model records `thinking` again.
  - Room AI status (feature 25): each status is also written
    to the room's `aiStatus` storage key
    (`lib/design-agent-status.ts`, `mutateStorage` from the
    Liveblocks Node client; created on the first write) as
    `{ step, message, runId, startedBy, updatedAt }`, so
    everyone in the project sees it. `done` gets only the
    short count of changes (`describeChanges`), not the
    model's text. A failed write is logged, never thrown.
    The type, the display rules and the parser are in
    `lib/ai-status.ts` (shared by server and client).
  - Chat replies (feature 26): `appendAssistantMessage`
    in `lib/design-agent-chat.ts` (`server-only`) appends a
    Ghost AI message (author `AI_USER`, optional `runId`)
    to the room's `aiChat` through `mutateStorage`, with
    the same trim, length cap and 200-message cap as the
    sidebar; blank text posts nothing. Not called yet:
    feature 27 connects the agent to the chat.
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
  point that joins a project's Liveblocks room; the AI
  sidebar is rendered as its child, inside the room but
  outside the canvas's Suspense boundary, so it renders
  while the room connects and reads storage with the
  non-suspense hooks;
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
  Architect chat (`use-ai-chat.ts`, owned by the AI
  sidebar: the room's shared `aiChat` messages through
  `useStorage`, sending through `useMutation` inside
  `room.history.disable`, so the canvas Undo never removes
  a chat message; only the draft is local; no AI replies
  yet), and the
  room's AI status as it should be shown now
  (`use-ai-status.ts`: re-renders when a finished status
  should disappear or an unfinished one goes stale).
- `lib/` — shared utilities: `cn()`, Prisma client
  singleton, Liveblocks and Blob helpers. Database queries
  live in `server-only` data modules (e.g.
  `lib/project-data.ts`) that route handlers and server
  components both call. `lib/task-run-data.ts` holds the
  `TaskRun` queries. `lib/project-access.ts` resolves
  the signed-in identity and whether it may open a project
  (owner or collaborator). `lib/user-profiles.ts`
  (`server-only`) looks up Clerk profiles (name, avatar) for
  collaborator emails and the owner. `lib/collaborators.ts`
  holds the email rules (trim + lowercase, validation) and
  share response types used by both server and client.
  `lib/api-client.ts` is the client helper for calling the
  JSON route handlers. `lib/liveblocks.ts` (`server-only`)
  holds `getLiveblocks()` (the Liveblocks Node client,
  created on first use and cached — never at import, so
  Trigger.dev can import task files to index them without
  the key) and `getUserColor()` (the cursor color palette).
  `lib/ai-user.ts` holds `AI_USER` (the design agent's
  presence identity), used by the server and the client.
  `lib/ai-chat.ts` holds the shared chat's message type,
  limits, content normalizer, parser and the one append
  function (`appendAiChatMessage`) both the sidebar and
  the server helper use.
  `lib/canvas-types.ts` holds the canvas node/edge types
  (`CanvasNode`, `CanvasEdge`, `CanvasNodeData`,
  `CanvasEdgeData`) and the edge type name
  (`LABELED_EDGE_TYPE`) — the one schema the canvas,
  storage, templates, AI generation and spec generation
  share. `lib/canvas-shapes.ts` is the one
  shape list (name, label, default size), the `shape` node
  type name, the handle ids (`NODE_HANDLE_SIDES`: top,
  right, bottom, left), and the drag-and-drop payload
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
   first run asks the CLI to log in to Trigger.dev. The
   tasks need `GOOGLE_GENERATIVE_AI_API_KEY`,
   `LIVEBLOCKS_SECRET_KEY` and `DATABASE_URL`.

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
  - `TaskRun`: one Trigger.dev run started from the app —
    Trigger.dev run id (unique; null until the task is
    triggered), project relation (cascade delete), Clerk id
    of who started it, kind (`DESIGN` | `SPEC`), timestamp.
    Indexed on projectId. The row is created before the
    trigger and its id is the run's idempotency key, so no
    run exists without a row; a failed trigger deletes it.
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
  aligned with the project id. Storage holds `flow`
  (`LiveblocksFlow<CanvasNode, CanvasEdge>`), the shape
  `useLiveblocksFlow` from `@liveblocks/react-flow` syncs
  (a new room starts with an empty flow), and the optional
  `aiStatus` (`LiveObject<AiStatus>`: `step` = `idle` |
  `started` | `thinking` | `applying` | `done` | `failed`,
  `message`, `runId`, `startedBy`, `updatedAt` as ISO).
  Only the design agent writes `aiStatus`; rooms that never
  had a run don't have it, and readers treat it as idle.
  Readers also treat an active step not updated for 3
  minutes as idle (a crashed worker can't leave the room
  locked), and show `done` / `failed` for 10 s after
  `updatedAt`. Clients can write storage, so readers parse
  it (`parseAiStatus`) and ignore a malformed value.
  The optional `aiChat` (feature 26) is the AI Architect
  chat everyone in the project shares:
  `LiveList<LiveObject<AiChatMessage>>` with `id`, `role`
  (`user` | `assistant`), `content` (trimmed, at most
  4,000 characters), `authorId` (Clerk id, or `ghost-ai`),
  `authorName`, `createdAt` (ISO) and an optional `runId`.
  Rooms start without it (read as empty); the first
  message creates it. Every append drops the oldest
  messages past 200. People append from the sidebar; the
  design agent appends through `lib/design-agent-chat.ts`.
  Readers parse it (`parseAiChatMessages`), skip malformed
  messages and show at most the newest 200.

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
- Background task runs are followed with a Trigger.dev
  public access token that reads exactly one run and
  expires after 1 hour. `POST /api/ai/runs/[runId]/token`
  issues it only when the run has a `TaskRun` row and the
  signed-in user is the owner or a collaborator of its
  project (feature 23); anyone else gets 404. The
  Trigger.dev secret key (`TRIGGER_SECRET_KEY`) stays on
  the server.

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
