Build the backend that turns a project's canvas (and its AI chat) into a Markdown technical specification: a start route and the `spec-generator` Trigger.dev task. No storage and no UI in this unit — the task returns the Markdown; feature 29 saves it and feature 30 shows it.

Same pattern as the design agent (features 23–24). Check the Trigger.dev and Liveblocks skills before writing code. Do not read, print or edit any `.env*` file.

### Shared Model Helper

- move the design agent's model list, 90 s per-call timeout, single retry and fallback loop (gemini-3.8-flash → 3.7-flash → 3.6-flash) into a shared server module (e.g. `lib/ai-models.ts`) so both tasks use the same behavior; the design agent keeps working exactly as before

### Start Route — `POST /api/ai/spec`

- body: `{ projectId: string }`
- signed out → 401; no access (not owner or collaborator) → 404
- record first, then trigger (as in feature 23): create a `TaskRun` row with `kind: SPEC`, trigger `spec-generator` with the row id as the idempotency key, store the run id, delete the row and return 502 if triggering fails
- payload: `{ projectId, userId, startedByName? }`
- respond `202` with `{ runId }`; the existing token route (`POST /api/ai/runs/[runId]/token`) already works for SPEC runs

### Task — `spec-generator`

- read the room's current canvas (reuse the design agent's canvas reader and describer) and the newest ~50 messages from the room's `aiChat` (feature 26) as extra context
- if the canvas has no nodes, fail with a clear message ("Add something to the canvas before generating a spec") without calling the model
- generate the spec with `generateText` (no tools) through the shared model helper
- system prompt: Ghost AI is a senior technical architect writing an implementation-ready spec for the system on the canvas; use clear Markdown with sections such as Overview, Components (one subsection per node, its role and responsibilities), Data Flow (from the edges and their labels), Data Storage, APIs and Integrations, Scaling and Reliability, Security, Open Questions; only describe what the canvas and chat support — list assumptions explicitly
- record status steps in run metadata (`started`, `generating`, `done`, `failed`) like the design agent, so the UI can show progress
- return `{ markdown: string; title: string }` (title from the project name, e.g. "<Project name> — Technical Spec")

### Check when done

    - `POST /api/ai/spec` returns 401 / 404 correctly and 202 with a run id for a member
    - a test run of `spec-generator` from the Trigger.dev dashboard on a project with a diagram returns a sensible Markdown spec
    - an empty canvas fails fast with the clear message
    - the design agent still works (shared helper refactor)
    - no TypeScript errors, no lint errors, `npm run build` passes
