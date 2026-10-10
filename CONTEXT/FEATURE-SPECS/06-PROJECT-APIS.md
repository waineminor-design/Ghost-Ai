The database schema is ready (feature 05). Build the backend REST API routes for projects. Backend only — do not change any UI in this unit.

Read the Next.js 16 route handler docs in `node_modules/next/dist/docs/` before writing handlers (dynamic `params` are async in this version).

### Routes

`app/api/projects/route.ts`:
    - `GET /api/projects` — list the signed-in user's projects: owned projects, plus projects shared with them (a `ProjectCollaborator` row whose email matches the user's primary Clerk email). Newest first.
    - `POST /api/projects` — create a project owned by the signed-in user

`app/api/projects/[projectId]/route.ts`:
    - `PATCH /api/projects/:projectId` — rename a project
    - `DELETE /api/projects/:projectId` — delete a project (collaborators cascade)

### Rules

- use the authenticated Clerk user id as `ownerId` — never trust an owner id sent by the client
- POST body: `{ name?: string }`
    - trim the name; if missing or blank, use `"Untitled Project"`
    - reject names over 100 characters with 400
- project id: generated on the server as `<slug>-<6 random lowercase letters/digits>`, using the existing `toProjectSlug()` from `lib/projects.ts` (if the slug is empty, use `project-<suffix>`). This id is also the future Liveblocks room id, so it must be URL-safe and unique. No sequential ids.
- PATCH body: `{ name: string }` — trimmed, 1–100 characters, otherwise 400
- put the database queries in a small server-only data module (e.g. `lib/project-data.ts`) that the routes call — feature 07 will reuse it from server components

### Security

- unauthenticated requests return `401` with a JSON error
- make sure `proxy.ts` does not redirect or 404 `/api` requests before the handler runs — the handlers do their own auth checks and must be able to return 401 JSON
- only the project owner can rename or delete; a non-owner returns `403`
- a project id that does not exist returns `404`
- validate the request body before any database call; invalid JSON returns `400`

### Responses

- consistent JSON shapes: success returns the project (or `{ owned, shared }` for GET); errors return `{ error: string }`
- POST returns `201`, DELETE returns `204` with no body

### Check when done

    - all four routes exist
    - owner checks enforced on PATCH and DELETE (403 for non-owners)
    - 401 for signed-out requests to every route, 404 for unknown ids, 400 for bad input
    - no UI files changed
    - no TypeScript errors, no lint errors, `npm run build` passes
