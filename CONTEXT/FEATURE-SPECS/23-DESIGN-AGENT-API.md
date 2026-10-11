Build the backend wiring that starts an AI design run: an API route that triggers the `design-agent` task, a database model that records who started which run, and a token route the browser uses to follow a run live. No AI logic yet (the task stays a placeholder) and no UI.

Uses the Trigger.dev setup from feature 22. Request handlers never do AI work themselves — they only trigger tasks (`architecture.md` invariant).

### Run Tracking — Prisma model `TaskRun`

- fields: `id`, `runId` (Trigger.dev run id, unique, nullable until the task is triggered), `projectId` (relation to Project, cascade delete), `userId` (Clerk id of who started it), `kind` (enum `DESIGN` | `SPEC`), `createdAt`
- index on `projectId`
- new model file under `prisma/models/`; create and apply a migration
- after the migration, the owner must restart `npm run dev` (stale Prisma client otherwise) — say so in the progress tracker

### Start Route — `POST /api/ai/design`

- body: `{ projectId: string; prompt: string }`; prompt trimmed, 1–2000 characters → 400 otherwise
- signed out → 401; no access to the project (not owner or collaborator) → 404
- record first, then trigger, so a run can never exist without its tracking row:
    1. create a `TaskRun` row (`kind: DESIGN`, `runId` null)
    2. trigger the `design-agent` task with `{ projectId, prompt, userId }`, passing the row's `id` as Trigger.dev's idempotency key (a retried request can't start a second run)
    3. store the returned run id on the row
    4. if triggering fails, delete the row and respond `502` with a JSON error
- respond `202` with `{ runId }`

### Token Route — `POST /api/ai/runs/[runId]/token`

- signed out → 401
- look up the `TaskRun` by `runId`; return 404 unless it exists, has a run id, and the signed-in user has access to its project (owner or collaborator)
- create a Trigger.dev public access token scoped to read **only this run**, short-lived (e.g. 1 hour)
- respond `{ token }`

### Rules

- reuse `lib/project-access.ts` and `lib/api-response.ts`; database code in `lib/` data modules
- `/api` is passed through by `proxy.ts`, so every handler checks sign-in itself
- never return the Trigger.dev secret key; only the scoped public token

### Check when done

    - `TaskRun` model and migration exist and are applied
    - `POST /api/ai/design` returns 401 / 404 / 400 correctly and 202 with a run id for a member; the run appears in the Trigger.dev dashboard
    - the token route returns 401 / 404 correctly and a token scoped to that one run for a member
    - no TypeScript errors, no lint errors, `npm run build` passes
