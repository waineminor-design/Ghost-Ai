Save generated specs and serve them securely: the `spec-generator` task stores each Markdown spec in the private Vercel Blob store with a database record, and new routes list, read and download them. No UI in this unit.

Same hybrid storage pattern as canvas autosave (feature 21): content in Blob, metadata in Postgres. Do not read, print or edit any `.env*` file.

### Prisma Model — `ProjectSpec`

- fields: `id`, `projectId` (relation to Project, cascade delete), `runId` (Trigger.dev run id, unique — prevents a retried run from saving the same spec twice), `title`, `blobPath`, `sizeBytes`, `createdBy` (Clerk id), `createdByName` (optional), `createdAt`
- index on `(projectId, createdAt)`
- new model file under `prisma/models/`; create and apply a migration
- the owner must restart `npm run dev` afterwards (stale Prisma client otherwise) — note it in the progress tracker

### Saving (in the task)

- after generating, upload the Markdown to the private store at `specs/<projectId>/<runId>.md` (content type `text/markdown`; overwriting the same path is allowed, so a retry is harmless)
- then upsert the `ProjectSpec` row by `runId`
- after saving, write a `specsUpdatedAt` timestamp (ISO) to the room's storage (optional key, created on first write) so open clients know to refresh their spec list (feature 30); a failed write is logged, never thrown
- the task returns `{ specId, title }` (not the whole Markdown)

### Routes

All check sign-in first (401) and project access (owner or collaborator; otherwise 404). A spec id that doesn't belong to the project → 404. Never return Blob URLs or the token.

- `GET /api/projects/[projectId]/specs` — the project's specs, newest first: `id`, `title`, `createdAt`, `createdByName`, `sizeBytes`
- `GET /api/projects/[projectId]/specs/[specId]` — `{ id, title, createdAt, markdown }` for the in-app preview
- `GET /api/projects/[projectId]/specs/[specId]/download` — the raw Markdown with `Content-Type: text/markdown; charset=utf-8` and `Content-Disposition: attachment; filename="<slug-of-title>.md"`

### Notes

- deleting a project removes its `ProjectSpec` rows (cascade); the Blob files stay behind — record this as an open question in the progress tracker (cleanup can come later)
- reuse `lib/project-access.ts`, `lib/api-response.ts` and the Blob helpers from feature 21 (extend `lib/canvas-storage.ts` or add a sibling module)

### Check when done

    - `ProjectSpec` model and migration exist and are applied
    - a `spec-generator` run saves one Blob file and one row; replaying the same run does not create a second row
    - the three routes return 401 / 404 correctly and the right data for a member; download triggers a `.md` file download
    - no TypeScript errors, no lint errors, `npm run build` passes
