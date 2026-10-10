Set up Prisma with PostgreSQL: install it, add the project data models, a cached Prisma client singleton, and run the first migration. No API routes and no UI changes in this unit.

The database already exists (Prisma Postgres) and its connection string is in `.env.local` as `DATABASE_URL`. Do not read, print or edit any `.env*` file — the value is secret and agent access to it is blocked. Load it through config, never by inspecting it.

### Setup

- dev dependencies: `prisma`, `tsx`, `@types/pg`
- dependencies: `@prisma/client`, `@prisma/adapter-pg`, `pg`, `dotenv`
- read the installed Prisma docs/CLI help for the installed major version before writing config — do not rely on older Prisma conventions
- initialize Prisma with the generated client output at `app/generated/prisma`
- `prisma.config.ts`:
    - load environment variables from `.env.local` (Next.js uses `.env.local`, not `.env`)
    - schema path is the `prisma/` folder (multi-file schema), not a single `schema.prisma`
- if `prisma init` creates a `.env` file, stop and tell the owner to delete it (agents cannot touch `.env*` files); do not leave a second placeholder `DATABASE_URL`
- add `app/generated/` to `.gitignore`
- add a `postinstall` script that runs `prisma generate` (needed later for Vercel builds)

### Models

Put each model in its own file under `prisma/models/`.

Project:
    - id (use Prisma's default id strategy, e.g. cuid — no sequential ids)
    - ownerId — the Clerk user id
    - name
    - description — optional
    - status — enum `DRAFT` | `ARCHIVED`, default `DRAFT`
    - canvasJsonPath — optional, reserved for the future canvas snapshot in Vercel Blob
    - createdAt / updatedAt
    - indexes on ownerId and createdAt

ProjectCollaborator:
    - id
    - relation to Project with cascading delete
    - email — the collaborator's email
    - createdAt
    - unique constraint on (projectId, email)
    - index for looking up projects by email

Do not add any other fields unless Prisma requires them.

### Prisma Client

- create `lib/prisma.ts` exporting one cached Prisma client instance (reused across hot reloads in development)
- connect through `@prisma/adapter-pg` using `DATABASE_URL` (the connection string is a direct `postgres://` URL — no Accelerate)

### Migration

- run the first migration (name it `init`) and generate the client
- the migration must create both tables in the remote database

### Check when done

    - dependencies installed: prisma, @prisma/client, @prisma/adapter-pg, pg
    - both models exist with the correct relation, cascade delete, unique constraint and indexes
    - `lib/prisma.ts` exports a single cached instance
    - migration ran successfully against the database
    - no `.env*` file was read or edited by the agent
    - `app/generated/` is git-ignored
    - `npm run build` passes
