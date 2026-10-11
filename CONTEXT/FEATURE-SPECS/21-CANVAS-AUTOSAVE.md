Persist a snapshot of each project's canvas to Vercel Blob, automatically and on demand, so the diagram is stored outside Liveblocks (later features read it for AI and spec generation). Follows the hybrid storage model in `architecture.md`: JSON in Blob, only the path in Postgres.

The owner has created a **private** Vercel Blob store and put its token in `.env.local` as `BLOB_READ_WRITE_TOKEN`. Do not read, print or edit any `.env*` file. Read the installed `@vercel/blob` docs for the current API, including how private stores are written and read.

### Storage

- install `@vercel/blob`
- one snapshot per project at a stable path, e.g. `canvas/<projectId>.json`
- the store is private: never make snapshots publicly readable, and never send a Blob URL or token to the browser
- overwriting the same path must work every time (set the SDK's overwrite option) — saving must not fail after the first save
- store the snapshot's path in the existing `Project.canvasJsonPath` column (no schema change)
- snapshot content: `{ version: 1, savedAt, nodes, edges }` using the shared canvas types

### API — `/api/projects/[projectId]/canvas`

- `PUT` saves a snapshot; `GET` returns the latest snapshot JSON (404 if none)
- signed out → 401; no access (not owner or collaborator) or unknown project → 404; both owner and collaborators may save and read
- validate the body: an object with `nodes` and `edges` arrays, size-capped (e.g. 2 MB) → 400 otherwise
- the server reads/writes Blob with the token; the browser only talks to this route
- reuse `lib/project-access.ts`, `lib/api-response.ts`; keep Blob code in a small server-only module (e.g. `lib/canvas-storage.ts`)

### Autosave

- a hook in the canvas that saves the current nodes and edges:
    - automatically, debounced ~3 seconds after the last canvas change
    - immediately when the user clicks `Save`
    - once more on page hide/unload if there are unsaved changes (best effort)
- do not use an `isMounted` ref guard (it breaks under React strict mode in development); handle stale requests with an `AbortController` or a request counter instead
- skip saving when nothing changed since the last successful save
- only one save in flight at a time; a change during a save schedules another after it

### Save Button and Status

- in the workspace navbar, a `Save` button with a status: `Save` (idle/up to date), `Saving…`, `Saved` (briefly, then back to `Save`), `Save failed` (with a retry on click)
- the status must actually change on every save; test it in development (React strict mode)

### Restore

- when a project's room has empty storage but a snapshot exists, load the snapshot into the room once (owner or collaborator), through the Liveblocks-synced flow
- never overwrite a non-empty room with an older snapshot

### Check when done

    - moving a node and waiting ~3 s saves (status shows Saving… then Saved); the Blob store shows `canvas/<projectId>.json` updated
    - clicking Save works repeatedly, not just the first time
    - snapshots are private: the API never returns a public Blob URL
    - signed out → 401 and a non-member → 404 on both GET and PUT
    - a project with an empty room but a saved snapshot loads the snapshot
    - no `.env*` file was read or edited by the agent
    - no TypeScript errors, no lint errors, `npm run build` passes
