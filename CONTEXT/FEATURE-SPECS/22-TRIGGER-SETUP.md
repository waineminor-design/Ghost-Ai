Set up Trigger.dev for long-running background work (AI design and spec generation). Infrastructure only — no AI logic, no API routes, no UI.

The owner has a Trigger.dev project. `.env.local` contains `TRIGGER_SECRET_KEY` and `TRIGGER_PROJECT_REF`. Do not read, print or edit any `.env*` file. Read the installed Trigger.dev SDK docs (or the Trigger.dev agent skill, if installed) for the current major version before writing config.

### Packages

- `@trigger.dev/sdk` (and `@trigger.dev/build` as a dev dependency if the config needs it)

### Config — `trigger.config.ts` (project root)

- project ref read from the `TRIGGER_PROJECT_REF` environment variable
- Node runtime
- task directory: `./trigger`
- max duration: 3600 seconds
- retries enabled by default: up to 3 attempts with exponential backoff
- make sure the Prisma client and other server code the tasks will import later can be bundled (follow the SDK's guidance for Prisma, e.g. its Prisma build extension)

### Tasks

- create `trigger/` with two placeholder tasks that only log their input and return it — no AI yet:
    - `design-agent` — payload `{ projectId: string; prompt: string; userId: string }`
    - `spec-generator` — payload `{ projectId: string; userId: string }`
- typed payloads; task ids exactly as above (later features trigger them by id)

### Local Development

- add an npm script `"trigger:dev": "trigger.dev dev"`
- the local worker must be able to see the same environment variables as the Next.js app (`.env.local`): check how the installed CLI loads env files and, if `.env.local` is not loaded by default, pass it explicitly in the script (e.g. an `--env-file` option)
- add `.trigger/` to `.gitignore`
- document in `CONTEXT/architecture.md` that local development needs two terminals: `npm run dev` and `npm run trigger:dev`, and that production task environment variables are set in the Trigger.dev dashboard (deploy step)

### Check when done

    - `trigger.config.ts` and `trigger/` exist; both placeholder tasks are exported with the ids above
    - `npm run trigger:dev` script exists and loads `.env.local`
    - `.trigger/` is git-ignored; no `.env*` file was read or edited
    - no TypeScript errors, no lint errors, `npm run build` passes
    - (owner checks) running `npm run trigger:dev` and logging in shows both tasks in the Trigger.dev dashboard
