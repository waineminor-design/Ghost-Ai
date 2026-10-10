# AI Workflow Rules

## Approach

Build this project incrementally using a spec-driven
workflow. The context files define what to build, how to
build it, and the current state of progress. Each unit of
work has a feature spec in `CONTEXT/FEATURE-SPECS/`.
When debugging, describe the problem in
`CONTEXT/current-issues.md` (git-ignored), analyze it, and
propose a fix before changing code. Never paste API keys
or tokens into it.
Always implement against these specs — do not infer or
invent behavior from scratch.

For each unit:

1. Read the feature spec and the context files.
2. Mark the unit as in progress in `progress-tracker.md`.
3. Implement exactly as specified — nothing beyond scope.
4. Run the spec's verification checklist.
5. Mark the unit complete in `progress-tracker.md`.

## Scoping Rules

- Work on one feature unit or subsystem at a time.
- Prefer small, verifiable increments over large
  speculative changes.
- Do not combine unrelated system boundaries in a single
  implementation step.
- Stay in scope: do not add features, wiring or refactors
  the spec did not ask for.

## When to Split Work

Split an implementation step if it combines:

- Backend changes (API routes, database) and frontend
  wiring (UI, server components).
- UI changes and background task (Trigger.dev) changes.
- Multiple unrelated API routes.
- Behavior not clearly defined in the context files.

If a change cannot be verified end to end quickly, the
scope is too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the
  context files.
- If a requirement is ambiguous, resolve it in the
  relevant context file before implementing.
- If a requirement is missing, add it as an open question
  in `progress-tracker.md` before continuing.
- When a decision is needed that the docs do not answer,
  stop and ask.

## Protected Files

Do not modify the following unless explicitly instructed:

- `components/ui/*` — generated shadcn/ui components
- `app/generated/*` — generated Prisma client output
- Third-party library internals and `node_modules/`
- Existing migrations under `prisma/migrations/`
- The Next.js-managed block in `AGENTS.md` / `CLAUDE.md`

## Keeping Docs in Sync

Update the relevant context file whenever implementation
changes:

- System architecture or boundaries
- Storage model decisions
- Code conventions or standards
- Feature scope

Record notable architectural decisions in
`progress-tracker.md`.

## Before Moving to the Next Unit

1. The current unit works end to end within its defined
   scope.
2. No invariant defined in `architecture.md` was violated.
3. `progress-tracker.md` reflects the completed work.
4. `npm run build` passes (plus `tsc` and lint).
