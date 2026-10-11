# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Feature 22 (Trigger.dev Setup) built; `tsc`, `eslint`,
  `npm run build` and an offline bundle of the tasks pass.
  Not yet run against the owner's Trigger.dev project
  (needs the CLI login).

## Current Goal

- Owner runs `npm run trigger:dev`, logs in, and checks
  that `design-agent` and `spec-generator` show in the
  Trigger.dev dashboard; plus the still-pending browser
  checks of features 18-21

## Completed

- Cleaned up Next.js boilerplate (2026-10-09): `globals.css`
  reduced to `@import "tailwindcss";`, default SVGs removed
  from `public/`, `page.tsx` replaced with a centered
  "ghost AI" placeholder. Favicon kept at `app/favicon.ico`.
- 01 Design System (2026-10-09,
  spec: `CONTEXT/FEATURE-SPECS/01-DESIGN-SYSTEM.md`):
  - shadcn/ui initialised (CLI 4.21.4, `base-nova` style,
    Base UI primitives, `neutral` base color, CSS variables).
  - Added `components/ui/`: button, card, dialog, input,
    tabs, textarea, scroll-area. Generated files untouched.
  - `lucide-react` installed.
  - `lib/utils.ts` exports `cn()` (shadcn's `cn` package —
    drop-in for clsx + tailwind-merge). Verified: conflict
    resolution, conditionals, arrays.
  - Dark-only theme: `:root` holds only the dark token set
    (light values removed), `color-scheme: dark`, and `dark`
    class on `<html>` so components' `dark:` variants apply.
  - Fixed generated self-referencing `--font-sans`; now maps
    to Geist (`--font-geist-sans` / `--font-geist-mono`).
  - Verified: all components import and render via a
    temporary page (removed), `tsc`, `eslint`, and
    `npm run build` pass; compiled CSS contains no light
    token values.

- 02 Editor chrome (2026-10-09,
  spec: `CONTEXT/FEATURE-SPECS/02-EDITOR.md`):
  - `components/editor/editor-navbar.tsx` — `h-12` grid with
    left/center/right sections; left holds the sidebar toggle
    (`PanelLeftOpen` / `PanelLeftClose` by state); center and
    right empty. `bg-background` + `border-b border-border`.
    Props: `isSidebarOpen`, `onToggleSidebar`.
  - `components/editor/project-sidebar.tsx` — absolutely
    positioned floating panel (`bg-sidebar` tokens), slides
    in from the left via `translate-x`, `inert` when closed.
    `Projects` header + close button, shadcn `Tabs`
    (`My Projects` / `Shared`) with empty states, full-width
    `New Project` button with `Plus` icon. Props: `isOpen`,
    `onClose`, optional `onNewProject` (no behavior wired).
  - `components/editor/editor-dialog.tsx` — `EditorDialog`
    wrapper over the shadcn Dialog: `title`, optional
    `description`, optional `footer` actions, `children`;
    controlled via `open` / `onOpenChange`. Token-styled.
    No concrete dialogs built.
  - Verified: rendered all three via a temporary
    `/editor-preview` route (removed), `tsc`, `eslint`, and
    `npm run build` pass.
  - Re-checked against the bundled Next.js 16.4 docs
    (`use-client.md`, `server-and-client-boundary.md`) per
    the new `CLAUDE.md` rule; no changes needed (see
    Architecture Decisions).
- Editor route (2026-10-09, user request so the chrome can be
  tried in the browser; not part of a spec):
  - `components/editor/editor-shell.tsx` — `'use client'`
    entry point; owns sidebar open state (starts closed),
    renders navbar + `relative` canvas area with the floating
    sidebar; canvas content via `children`.
  - `app/editor/layout.tsx` — server layout
    (`LayoutProps<"/editor">`) wrapping its children in
    `<EditorShell>`, so every route under `/editor` gets the
    navbar + sidebar and their state persists across child
    navigations.
  - `app/editor/page.tsx` — the canvas content; currently
    renders nothing. Visit `/editor`.
  - `New Project` is still unwired (spec: no actual dialogs
    yet).
  - Verified: `tsc`, `eslint`, `npm run build` pass; dev
    server serves `/editor` with one navbar, closed sidebar,
    tabs and `New Project` button in the HTML.

- 03 Auth (2026-10-10,
  spec: `CONTEXT/FEATURE-SPECS/03-AUTH.md`):
  - Installed `@clerk/nextjs` 7.9.14 (the spec said it was
    already installed; it was not) and `@clerk/ui` 1.40.0.
  - `lib/clerk-appearance.ts` — `clerkAppearance`: Clerk
    `dark` theme + variables mapped to `globals.css` tokens
    (`var(--primary)`, `var(--border)`, `var(--radius)`, ...);
    fonts via `--font-geist-sans` / `--font-geist-mono`.
    `authFormAppearance` flattens the Clerk card (no shadow,
    border or separate surface) on the auth pages.
  - `app/layout.tsx` — `ClerkProvider` wraps `<html>` with
    `clerkAppearance`, `signInFallbackRedirectUrl` and
    `signUpFallbackRedirectUrl` = `/editor`, and
    `afterSignOutUrl` = `NEXT_PUBLIC_CLERK_SIGN_IN_URL`.
  - `app/(auth)/layout.tsx` — 50/50 grid on `lg`: left
    `bg-sidebar` panel (logo, tagline, 3 features) hidden
    below `lg`; right panel centers the form inside
    `<Suspense>`. Pages: `app/(auth)/sign-in/[[...sign-in]]`
    and `app/(auth)/sign-up/[[...sign-up]]` render `<SignIn />`
    / `<SignUp />`.
  - `proxy.ts` (project root) — `clerkMiddleware`; public =
    `NEXT_PUBLIC_CLERK_SIGN_IN_URL(.*)` and
    `NEXT_PUBLIC_CLERK_SIGN_UP_URL(.*)`; everything else
    `auth.protect()`. Standard Clerk matcher. No
    `middleware.ts`.
  - `app/page.tsx` — signed in → `/editor`, signed out →
    `redirectToSignIn()`.
  - `components/editor/editor-navbar.tsx` — default
    `<UserButton />` in the right section.
  - Verified: `tsc`, `eslint`, `npm run build` pass. Against
    `next start`: `/`, `/editor`, `/editor/x`, `/api/x` → 307
    to `/sign-in?redirect_url=...`; `/sign-in`, `/sign-up`,
    `/sign-in/factor-one` → 200; auth HTML has the left panel.
    No hex/oklch/raw palette classes in the new files.
  - Not verified (needs a browser + a Clerk account): an
    actual sign-in landing on `/editor`, and sign-out via
    `UserButton`.
- 03 review follow-ups (2026-10-10):
  - `app/layout.tsx` metadata: title "Ghost AI" + real
    description (was the create-next-app default).
  - `proxy.ts`: sign-in/sign-up URLs fall back to `/sign-in`
    and `/sign-up` when the env vars are missing, so the auth
    pages can never become protected (redirect loop).
  - Turned off `experimental.agentFeedback` in
    `next.config.ts` (owner's choice) and removed its block
    from `AGENTS.md`.
  - Verified: `tsc`, `eslint`, `npm run build` pass.

- 04 Project Dialogs (2026-10-10,
  spec: `CONTEXT/FEATURE-SPECS/04-PROJECT-DIALOGS.md`):
  - `lib/projects.ts` — `Project` interface (`id`, `name`,
    `ownerId`) and `toProjectSlug()` (NFKD, strips accents,
    lowercase, non-alphanumeric runs → `-`, trims hyphens;
    `"!!!"` → `""`).
  - `lib/mock-projects.ts` — `MOCK_CURRENT_USER_ID` and
    `MOCK_PROJECTS`: 3 owned, 2 shared (owned by
    `user_mock_teammate`).
  - `hooks/use-project-dialogs.ts` — `useProjectDialogs()`
    owns the active dialog, target project, name, derived
    slug, `isNameValid` (non-blank name and non-empty slug)
    and `isSubmitting`. `submit()` simulates a 600 ms request
    and closes the dialog; the dialog can't be dismissed
    while submitting.
  - `components/editor/project-dialogs.tsx` — create and
    rename dialogs (name input, live slug preview, error
    hint when the slug would be empty, submit disabled when
    invalid, spinner + "Creating…"/"Renaming…" while
    pending; Enter submits) and the delete dialog (names the
    project, "cannot be undone", Cancel + destructive
    Delete). All on `EditorDialog`, tokens only.
  - `components/editor/project-dialogs-context.ts` —
    `ProjectDialogsContext` + `useProjectDialogActions()` so
    editor pages can open the create dialog owned by the
    shell.
  - `components/editor/editor-home.tsx` (`'use client'`) —
    centered heading, description and `New Project` button;
    rendered by `app/editor/page.tsx`.
  - `components/editor/editor-shell.tsx` — calls
    `useProjectDialogs()`, provides the context, passes
    mock projects + handlers to the sidebar and renders
    `ProjectDialogs`.
  - `components/editor/project-sidebar.tsx` — `My Projects`
    lists owned projects, `Shared` lists the rest. Rename /
    Delete icon buttons render only when
    `project.ownerId === currentUserId` (always visible on
    mobile, on hover/focus from `md`). Mobile-only
    (`md:hidden`) backdrop scrim behind the open sidebar;
    tapping it closes the sidebar.
  - Verified: `tsc`, `eslint`, `npm run build` pass.
    Prerendered `/editor` HTML has the home heading,
    description, owned projects with `Rename …` / `Delete …`
    actions and the scrim. Slug function checked against
    sample names (`"!!!"`, `"   "` → empty). Base UI `Button`
    keeps `type="submit"` / `form` (caller props override its
    default `type="button"`).
  - Not verified in a browser: `/editor` needs a Clerk
    sign-in, so dialog open/close, typing and the mobile
    scrim were checked by code and build output only.
  - Browser-verified by the owner (2026-10-10, signed in via
    Clerk): sign-in → `/editor` works; create dialog rejects a
    symbols-only name; sidebar lists owned projects; rename
    dialog prefills name + slug; delete dialog names the
    project with Cancel + Delete. Mobile scrim not checked.
  - Earlier sign-in loop was caused by a ~6 s slow system
    clock (Clerk "iat in the future"); fixed by a Windows time
    sync plus a fresh browser session.

- 05 Prisma (2026-10-10,
  spec: `CONTEXT/FEATURE-SPECS/05-PRISMA.md`):
  - Installed `@prisma/client` + `@prisma/adapter-pg` 7.10.0,
    `pg`, `dotenv`; dev: `prisma` 7.10.0 (pinned — npm's
    `latest` tag is `8.0.0-rc.22`, whose deps don't resolve
    and which wouldn't match the 7.10 client), `tsx`,
    `@types/pg`. `postinstall` runs `prisma generate`.
  - `prisma init` was not run: in 7.10 it writes a `.env`
    with a placeholder `DATABASE_URL` whenever `.env` is
    missing (only `.env.local` exists). Its output was
    reproduced by hand from the CLI's own templates, so no
    `.env` file was created.
  - `prisma.config.ts` — loads `.env.local` via dotenv;
    `schema: "prisma"` (multi-file), migrations in
    `prisma/migrations`; datasource url from
    `process.env["DATABASE_URL"]` (not `env()`, which throws,
    so `prisma generate` / `postinstall` work without it).
  - `prisma/schema.prisma` — `prisma-client` generator,
    output `app/generated/prisma` (git-ignored); postgresql
    datasource (url lives in the config in Prisma 7).
  - `prisma/models/project.prisma` — `ProjectStatus` enum
    (`DRAFT` | `ARCHIVED`) and `Project` (cuid id, ownerId,
    name, description?, status default `DRAFT`,
    canvasJsonPath?, createdAt/updatedAt; indexes on ownerId
    and createdAt). `collaborators` back-relation field is
    the only addition (Prisma requires it).
  - `prisma/models/project-collaborator.prisma` —
    `ProjectCollaborator` (cuid id, projectId → Project with
    `onDelete: Cascade`, email, createdAt; unique
    (projectId, email); index on email).
  - `lib/prisma.ts` — exports `prisma`, one `PrismaClient`
    over `PrismaPg({ connectionString: DATABASE_URL })`,
    cached on `globalThis` outside production.
  - Migration `20261010225718_init` created and applied to
    the remote Prisma Postgres database.
  - Verified: `prisma validate`, `prisma migrate status`
    ("up to date"); a tsx script through `lib/prisma.ts`
    counted 0 rows in both tables, listed all 6 expected
    indexes, confirmed the FK is `ON DELETE CASCADE`, and
    that repeated imports return the same instance. `tsc`,
    `eslint`, `npm run build` pass. No `.env*` file was
    read or edited.

- 06 Project APIs (2026-10-10,
  spec: `CONTEXT/FEATURE-SPECS/06-PROJECT-APIS.md`):
  - `lib/project-data.ts` (`server-only`) — the Prisma
    queries, reusable from server components:
    `listProjectsForUser` (owned + shared via a collaborator
    row whose email matches, case-insensitive; owned rows are
    excluded from `shared`; newest first), `createProject`,
    `getProjectOwnerId`, `renameProject`, `deleteProject`.
    Responses select every `Project` field except
    `canvasJsonPath` (internal Blob pointer).
  - Project ids: `<toProjectSlug(name)>-<6 chars a-z0-9>`
    (`project-<suffix>` for an empty slug), suffix from
    `crypto.randomInt`; on a unique-key collision (P2002)
    it retries with a new suffix, up to 5 attempts.
  - `lib/api-response.ts` (`server-only`) — `jsonError()`
    (`{ error }` + status) and `readJsonObject()` (null for
    invalid JSON or a non-object body).
  - `lib/projects.ts` — added `DEFAULT_PROJECT_NAME`
    ("Untitled Project") and `PROJECT_NAME_MAX_LENGTH` (100).
  - `app/api/projects/route.ts` — `GET` → `{ owned, shared }`
    (email from Clerk `currentUser()`); `POST` → 201 project.
    `app/api/projects/[projectId]/route.ts` — `PATCH` → 200
    project, `DELETE` → 204 (collaborators cascade in the DB).
    Order in every handler: 401 → body validation (400) →
    404 → 403 → write. `ownerId` always comes from `auth()`;
    a client-sent owner id is ignored.
  - POST with an empty body is treated as `{}` (name is
    optional); any non-empty body must be a JSON object.
  - `proxy.ts` — `/api` and `/api/(.*)` added to the public
    matcher so handlers return their own 401 JSON; the
    middleware still runs on them so `auth()` works.
  - Installed `server-only` as a direct dependency (it was
    only transitive via Clerk).
  - Verified: `tsc`, `eslint`, `npm run build` pass. Against
    `next start`, signed-out GET/POST/PATCH/DELETE return 401
    `{"error":"Unauthorized"}`. A script ran the real route
    handlers against the database with Clerk's `auth()` /
    `currentUser()` stubbed (30 checks, all pass): 400 for
    invalid JSON, non-object bodies, non-string names, 101-char
    names, blank PATCH names, and before the 404 lookup; 201 with
    trimmed names, `"Untitled Project"` default, ids matching
    `my-cafe-flow-xxxxxx` / `project-xxxxxx`, spoofed `ownerId`
    ignored; shared listing by case-insensitive email; 403 for a
    collaborator renaming/deleting; 404 for unknown ids; 204
    delete with collaborator rows cascaded. Test rows were
    deleted afterwards.
  - Not verified: the routes with a real Clerk session (needs
    a browser sign-in). No UI files changed.

- 07 Wire editor home (2026-10-10,
  spec: `CONTEXT/FEATURE-SPECS/07-WIRE-EDITOR-HOME.md`):
  - `app/editor/layout.tsx` — inside a `<Suspense>`
    boundary, `EditorChrome` creates (does not await) a
    promise from `loadEditorProjects()`: Clerk `auth()` +
    `currentUser()` email → `listProjectsForUser()` from
    `lib/project-data.ts`, narrowed to `{ id, name, ownerId }`.
    Per the authentication-with-cache-components guide, so
    the navbar, page and sidebar frame stay in the static
    shell (`/editor` is now `◐`) and only the project lists
    stream in. Signed out → `redirectToSignIn()`.
  - `lib/projects.ts` — `EditorProjects`
    (`currentUserId`, `owned`, `shared`).
  - `EditorShell` takes `projectsPromise` and passes it to
    `ProjectSidebar`; each tab's list resolves it with
    `use()` behind its own `<Suspense>` ("Loading
    projects…" spinner). My Projects = `owned`, Shared =
    `shared`; rename/delete buttons show when
    `ownerId === currentUserId` (the real Clerk user id).
  - `lib/mock-projects.ts` deleted; no mock data remains.
  - `hooks/use-project-dialogs.ts` — same hook, now calls
    the API: create `POST /api/projects` → `router.push`
    to `/editor/<id>`; rename `PATCH`; delete `DELETE`, and
    `router.replace("/editor")` when the current path is that
    project. Each success then runs `router.refresh()`.
    Close + navigation + refresh run in one transition, so
    the dialog keeps its spinner until the sidebar has the
    new data. Push comes before refresh on purpose: a
    navigation discards a pending refresh, while a refresh
    queued after it re-fetches the shared layout and clears
    the client segment cache and BFCache (checked in Next's
    `refresh-reducer.js`), so `/editor` shows the new
    project when the user returns.
  - Failed requests keep the dialog open and show the API's
    `error` message (or a network / generic message) under
    the form (`role="alert"`, `text-destructive`). The error
    clears when a dialog opens or is resubmitted.
  - Create dialog preview reads `Room ID: <slug>-xxxxxx`;
    rename keeps `Slug: <slug>`. Validation and loading
    states unchanged (no client max-length check; the API's
    100-char 400 shows in the dialog).
  - Verified: `tsc`, `eslint`, `npm run build` pass.
    Prerendered `/editor` HTML has the navbar, home heading,
    sidebar frame and "Loading projects…" fallback, and no
    mock project names. Signed out, `/editor` still 307s and
    `/api/projects` returns 401.
  - Not verified (needs a browser signed in with Clerk):
    real projects in the sidebar, create → `/editor/<id>`
    (a not-found page until the workspace page exists),
    rename/delete updating the sidebar, the in-dialog error.
  - Browser-verified by the owner (2026-10-10): empty
    sidebar on a fresh database; create shows the
    `<slug>-xxxxxx` room id preview, saves, and navigates to
    `/editor/<slug>-<suffix>` (404 as expected); the project
    appears in My Projects; rename and delete update the
    sidebar. The in-dialog error state was not exercised.
  - Live API check (signed out, `next start`): GET/POST
    `/api/projects` and PATCH/DELETE `/api/projects/:id` all
    return 401 JSON.
  - Note: `pg` warns that `sslmode=require` will change
    meaning in pg v9; the owner can set
    `sslmode=verify-full` in `DATABASE_URL` (same behavior
    today) to silence it.

- 08 Editor Workspace Shell (2026-10-10,
  spec: `CONTEXT/FEATURE-SPECS/08-EDITOR-WORKSPACE-SHELL.md`):
  - `lib/project-access.ts` (`server-only`) —
    `getCurrentIdentity()` (Clerk user id + primary email,
    null when signed out; wrapped in React `cache()` so the
    layout and page share one Clerk lookup per request) and
    `getProjectAccess(projectId, identity)` →
    `{ project, role: "owner" | "collaborator" }` or null.
  - `lib/project-data.ts` — new `findAccessibleProject()`
    (one query: id AND (owner OR collaborator email)). The
    case-insensitive collaborator filter is now one helper,
    `hasCollaboratorEmail()`, shared with
    `listProjectsForUser()`.
  - `app/editor/layout.tsx` — `loadEditorProjects()` now uses
    `getCurrentIdentity()` instead of its own Clerk calls.
  - `app/editor/[projectId]/page.tsx` — params, session and
    access check run inside the page's own `<Suspense>`
    (spinner fallback), so the editor chrome stays in the
    static shell (`◐`). Signed out → `redirectToSignIn()`;
    no access or unknown id → `AccessDenied` (same screen,
    existence not revealed); otherwise `ProjectWorkspace`.
  - `components/editor/access-denied.tsx` — centered `Lock`
    icon, "You don't have access to this workspace", a short
    hint, and an outline "Back to projects" link to `/editor`.
    Tokens only, no card.
  - `components/editor/project-workspace.tsx` — canvas
    placeholder (`bg-background`, "Canvas coming soon")
    filling the space, plus a `w-80` AI chat placeholder
    (`bg-sidebar`, `border-l border-border`). The chat panel
    is hidden below `md` so the canvas keeps its width on
    phones (the spec didn't cover mobile).
  - `hooks/use-current-project.ts` — `useCurrentProjectId()`
    (the `projectId` route param, via `useParams`) and
    `useCurrentProject(projectsPromise)` (finds it in the
    layout's owned + shared lists).
  - `components/editor/editor-navbar.tsx` — takes
    `projectsPromise`; center shows the open project's name
    (`h1`), right shows an outline `Share` button (no
    behavior) before `UserButton`. Both render nothing
    outside a workspace or on Access Denied.
  - `components/editor/project-sidebar.tsx` — each project
    name is a `Link` to `/editor/<id>` (rename/delete stay
    sibling buttons); the current project gets
    `bg-sidebar-accent` and `aria-current="page"`.
  - `/editor` home unchanged.
  - Verified: `tsc`, `eslint`, `npm run build` pass
    (`/editor/[projectId]` is `◐`). A script ran
    `getProjectAccess` against the database (10 checks, all
    pass): owner → `owner` (with or without email);
    collaborator → `collaborator` with a different-case
    email; stranger (with or without email) → null; unknown
    id → null; `canvasJsonPath` not returned; test rows
    deleted. Against `next start`, signed-out
    `/editor/<id>` 307s to `/sign-in?redirect_url=...`.
  - Not verified (needs a browser signed in with Clerk): the
    owner opening a workspace with the name in the navbar,
    a second account seeing Access Denied, sidebar click
    + highlight. No canvas, Liveblocks, chat or sharing
    logic added.

- 09 Share Dialog (2026-10-10,
  spec: `CONTEXT/FEATURE-SPECS/09-SHARE-DIALOG.md`):
  - `lib/collaborators.ts` (client-safe) — `normalizeEmail()`
    (trim + lowercase), `isValidEmail()` (one `@`, no
    whitespace, dot in the domain, max 254 chars) and the
    response types `MemberProfile`, `CollaboratorProfile`,
    `ProjectMembers`.
  - `lib/user-profiles.ts` (`server-only`) — Clerk backend
    lookups: `getProfilesByEmail()` (`users.getUserList` by
    email, batched by 100, every address of a user mapped)
    and `getProfileByUserId()` for the owner (`getUserList`
    by id, so a deleted user yields nulls instead of a
    throw). Name = `fullName ?? username`, avatar =
    `imageUrl`. A Clerk API failure is logged and degrades
    to emails only rather than failing the request.
  - `lib/project-data.ts` — `listCollaborators()` (oldest
    first), `addCollaborator()` (null on P2002 → 409) and
    `removeCollaborator()` (owner id in the delete filter,
    like `deleteProject`; false on P2025 → 404).
  - Routes (all via `getCurrentIdentity` +
    `getProjectAccess`; order 401 → body 400 → 404 → 403):
    `GET /api/projects/[projectId]/collaborators` →
    `{ owner, collaborators }`; `POST` (owner only)
    `{ email }` → 400 invalid / own email, 409 duplicate,
    201 enriched collaborator; `DELETE
    /api/projects/[projectId]/collaborators/[collaboratorId]`
    (owner only) → 204. No access or unknown project → 404,
    collaborator invite/remove → 403.
  - `lib/api-client.ts` — `sendJsonRequest()` (moved out of
    `use-project-dialogs.ts`, now with an `AbortSignal`) and
    `requestErrorMessage()`; the project dialogs hook uses it
    unchanged in behavior.
  - `hooks/use-project-share.ts` — `useProjectShare()` owns
    open state, members, invite email + validity, inviting /
    removing / loading state, the inline error and copy-link
    status. The list loads when the dialog opens; requests
    share one `AbortController` that is aborted on close and
    unmount, so late responses never touch a closed dialog.
    Copy link writes `<origin>/editor/<id>`; "Copied!" for
    2 s (timer cleared on close/unmount); a failed or missing
    `navigator.clipboard` shows an inline error instead.
  - `components/editor/share-dialog.tsx` — on `EditorDialog`:
    owner-only email + `Invite` (disabled while invalid or a
    request is pending), "People with access" list (owner
    first with an `Owner` badge, then collaborators; remove
    buttons owner-only), `Copy link` in the footer.
    `RequestError` is now exported from `project-dialogs.tsx`
    and reused here.
  - `components/editor/editor-navbar.tsx` — `Share` opens the
    dialog. `ShareAction` is keyed by project id, so
    switching workspaces resets share state. `isOwner` comes
    from the layout's `currentUserId` (display only).
  - Added shadcn `avatar` via the CLI
    (`components/ui/avatar.tsx`; no new dependencies).
  - Verified: `tsc`, `eslint`, `npm run build` pass (new
    routes are `ƒ`). A script ran the real route handlers
    against the database with Clerk's `auth()`,
    `currentUser()` and `clerkClient()` stubbed (35 checks,
    all pass): 401 signed out; 400 for invalid JSON, array
    body, missing / non-string / malformed / too-long email
    and the owner's own email in another case; 201 stores
    `friend@example.com` from `"  Friend@EXAMPLE.com "` with
    name + avatar; 409 for a case variant; unknown Clerk user
    → email only; collaborator GET 200 but POST/DELETE 403
    (row kept); stranger and unknown project → 404; a
    collaborator id from another project → 404; Clerk outage
    → 200 with emails only; owner DELETE 204, then the removed
    user gets 404. Test rows deleted. Against `next start`,
    signed-out GET/POST/DELETE return 401 JSON.
  - Not verified (needs a browser and two Clerk accounts):
    the dialog itself, the invited user seeing the project
    under `Shared` and opening it, the collaborator view
    without controls, Access Denied after removal, and the
    clipboard paths.
  - Browser-verified by the owner with two Clerk accounts
    (2026-10-10): owner invited the second account's email;
    the dialog listed the owner (Owner badge) and the
    collaborator with their Clerk name; the collaborator saw
    the project under `Shared`, opened the workspace, and got
    the view-only share dialog (no invite box, no remove
    buttons). Removal → Access Denied not yet re-checked in
    the browser (covered by the API check above).
  - Dev note: after features 08–09 the running `next dev`
    served a stale `lib/project-data.ts` ("findAccessibleProject
    is not a function") while `tsc` and `next build` passed.
    Fix: stop the dev server, delete `.next/`, restart.
    Same after feature 15: new `@theme` color tokens in
    `globals.css` were missing from the running dev server's CSS
    (swatches empty, nodes black) though the production build had
    them. After adding theme tokens, restart `next dev` (and clear
    `.next/` if they still don't appear). Feature 15 browser-
    verified after the restart: swatches show colors, picking blue
    recolors the node and syncs to the collaborator.

- 10 Liveblocks Setup (2026-10-10,
  spec: `CONTEXT/FEATURE-SPECS/10-LIVEBLOCKS-SETUP.md`):
  - Installed `@liveblocks/client`, `react`, `react-ui`,
    `react-flow`, `node` (all 3.24.3) and `@xyflow/react`
    12.12.0. The repo-local `liveblocks-best-practices`
    agent skill (`.claude/skills/`) was used for the auth
    and typing patterns.
  - `liveblocks.config.ts` — global `Liveblocks` types:
    Presence `cursor` (`{ x, y } | null`) + `isThinking`;
    UserMeta `id` (Clerk user id) + `info` (`name`,
    `avatar`, `color`); Storage `Record<string, never>`
    placeholder for feature 11.
  - Deviation: the spec says avatar "URL or null", but
    Liveblocks reserves `info.avatar` as `string |
    undefined` (a `null` type fails its UserMeta check), so
    `avatar` is optional and omitted when the user has none.
    Clerk always returns an `imageUrl`, so in practice it is
    always set.
  - `lib/liveblocks.ts` (`server-only`) — `liveblocks`, one
    Node client from `LIVEBLOCKS_SECRET_KEY` (cached on
    `globalThis` outside production, like `lib/prisma.ts`;
    throws a clear error if the key is missing), and
    `getUserColor(userId)`: FNV-1a hash of the id into an
    8-color `USER_COLORS` palette defined only there.
  - `lib/project-access.ts` — `Identity` gained `name`
    (`fullName ?? username`) and `imageUrl` from the Clerk
    user `getCurrentIdentity()` already loads, so the auth
    route doesn't make a second Clerk API call.
  - `app/api/liveblocks-auth/route.ts` — `POST`: 401 signed
    out → 400 unless the body is a JSON object with a
    non-empty `room` string of ≤ 128 chars and no `*` (a `*`
    would make it a prefix pattern) → 403 when
    `getProjectAccess` returns null → `prepareSession(userId,
    { userInfo: { name ?? "Anonymous", avatar, color } })`,
    `allow(project.id, ["*:write"])` (the deprecated
    `FULL_ACCESS` constant equals this), and Liveblocks'
    `{ body, status }` returned unchanged (a failed call is
    logged server-side).
  - Verified: `tsc`, `eslint`, `npm run build` pass
    (`/api/liveblocks-auth` is `ƒ`). A throwaway file
    confirmed `useMyPresence` / `useOthers` / `useStorage`
    pick up the config types. A script ran the real route
    handler against the database with Clerk stubbed and
    Liveblocks' HTTP call intercepted (30 checks, all pass):
    401 signed out; 400 for invalid JSON, empty / array body,
    missing / numeric / empty room, `*`, `lbtest-*`, 129
    chars; 403 for a stranger, an unknown project, the owner
    of another project, and a collaborator whose email is
    unverified, with no Liveblocks call for any rejected
    request; owner and collaborator (email in another case)
    → 200 with the token body unchanged, `userId` = Clerk id,
    permissions exactly `{ [projectId]: ["*:write"] }`, user
    info name / avatar / color (username and "Anonymous"
    fallbacks, avatar omitted when null); a Liveblocks 403 is
    passed through unchanged; `getUserColor` is deterministic
    and spreads over all 8 colors. Test rows deleted. Against
    `next start`, a signed-out POST returns 401 JSON.
  - Not verified: a real token from Liveblocks (the script
    intercepted the call so no test users were registered
    on the Liveblocks account). First real check is when
    feature 11 connects to a room in the browser.
  - No UI files changed; no `.env*` file read or edited.
  - `npm audit` reports 13 high findings, all in existing
    toolchain deps (`eslint-config-next`, `prisma`,
    `shadcn`); none come from the new packages.

- 11 Base Canvas (2026-10-10,
  spec: `CONTEXT/FEATURE-SPECS/11-BASE-CANVAS.md`):
  - `lib/canvas-types.ts` — `CanvasNodeData` (`label`,
    `shape`, `color`, all strings), `CanvasNode` =
    `Node<CanvasNodeData>`, `CanvasEdge` = `Edge`.
  - `liveblocks.config.ts` — Storage is
    `{ flow: LiveblocksFlow<CanvasNode, CanvasEdge> }`
    (`flow` is `useLiveblocksFlow`'s default storage key).
  - `components/canvas/canvas-room.tsx` (`'use client'`
    entry) — `LiveblocksProvider` (`authEndpoint`
    `/api/liveblocks-auth`) + `RoomProvider` (id = project
    id, presence `cursor: null`, `isThinking: false`,
    `initialStorage` = an empty flow). `ClientSideSuspense`
    shows a centered spinner + "Connecting to room…" until
    storage loads. `useErrorListener` catches
    `ROOM_CONNECTION_ERROR` and swaps in a centered error
    (code -1 / 4001 → "access could not be verified", other
    codes → "connection failed"). A 401/403 from the auth
    endpoint makes Liveblocks stop retrying and fire code
    -1, so a rejected token never leaves a blank canvas.
  - `components/canvas/canvas.tsx` — `useLiveblocksFlow`
    (`suspense: true`) feeds `ReactFlow` nodes, edges and
    the change / connect / delete handlers, so nothing is
    held in local state. `colorMode="dark"`, dot
    `Background`, `MiniMap` (`rounded-lg border
    border-border`). Pan and zoom are React Flow defaults.
    Imports `@xyflow/react/dist/base.css` (only here).
  - `app/globals.css` — `.react-flow` block maps React
    Flow's `--xy-*` variables to tokens: background
    `--background`, dots `--input`, minimap `--card`, mask
    `--background` at 60% (`color-mix`), mask stroke
    `--border`, minimap nodes `--accent`, attribution
    background transparent.
  - `components/editor/project-workspace.tsx` — the canvas
    section renders `<CanvasRoom key={projectId} …>` (keyed
    so switching projects resets the room's error state);
    the AI chat placeholder stays. `app/editor/[projectId]/
    page.tsx` passes `access.project.id` after the existing
    guard, so Access Denied is unchanged.
  - No shape panel, custom nodes, custom edges, toolbar
    controls or cursors added. `@liveblocks/react-flow`'s
    stylesheet is not imported (it only styles `Cursors`).
  - Verified: `tsc`, `eslint`, `npm run build` pass. The
    built CSS has React Flow's base styles in the canvas
    chunk and the `--xy-*` mapping in the global sheet.
    Checked each overridden `--xy-*` name against
    `base.css` (the dot color is `--xy-background-pattern-color`,
    not `...-dots-color`). Against `next start`, signed-out
    `/editor/x` → 307 to sign-in and a signed-out POST to
    `/api/liveblocks-auth` → 401.
  - Not verified (needs a browser and two Clerk accounts):
    "Connecting to room…" then the canvas, owner and
    collaborator in the same room at once, the error state
    on a refused token, and the first real Liveblocks token
    and storage load. A stranger's Access Denied and token
    refusal are unchanged from features 08 and 10.

- 12 Shape Panel (2026-10-10,
  spec: `CONTEXT/FEATURE-SPECS/12-SHAPE-PANEL.md`):
  - `lib/canvas-shapes.ts` — `CANVAS_SHAPES` (name, label,
    description, default width/height) for rectangle
    160×80, diamond 120×120, circle 100×100, pill 160×64,
    cylinder 120×100, hexagon 160×90; `CanvasShape`,
    `isCanvasShape()`, `getCanvasShape()`,
    `SHAPE_NODE_TYPE` (`"shape"`), `SHAPE_DRAG_MIME`
    (`application/ghost-shape`) and
    `parseShapeDragPayload()` (null unless the JSON has a
    known shape and positive finite width/height).
  - `lib/canvas-colors.ts` — `NODE_COLORS` (one `default`
    key → `fill-card` / `stroke-input` /
    `text-card-foreground`), `DEFAULT_NODE_COLOR`,
    `getNodeColorClasses()` (unknown keys → default).
  - `components/canvas/shape-panel.tsx` — React Flow
    `Panel` at `bottom-center`, pill-shaped (`rounded-full
    bg-card border-border`), `role="group"` /
    `aria-label="Shapes"`. One draggable button per shape
    with a Lucide icon (`RectangleHorizontal`, `Diamond`,
    `Circle`, `Pill`, `Cylinder`, `Hexagon`) and
    `aria-label` + `title` "Rectangle: component or
    service" etc. Drag start writes `{ shape, width,
    height }` JSON under the custom MIME type,
    `effectAllowed = "move"`.
  - `components/canvas/shape-node.tsx` — `ShapeNode`: SVG
    outline sized to the node (rect r=8, diamond polygon,
    ellipse, stadium rect, cylinder body + lid edge,
    hexagon), label centered (nothing rendered when empty),
    selected → 2px `stroke-primary`. Four `source` handles
    (top/right/bottom/left), visible on hover or when
    selected. Unknown shapes render as rectangles.
  - `components/canvas/canvas.tsx` — `Canvas` now wraps
    `CanvasFlow` in `ReactFlowProvider`. `onDragOver`
    → `preventDefault()` + `dropEffect = "move"`; `onDrop`
    → `preventDefault()`, parse the payload (non-shapes
    ignored), `screenToFlowPosition`, node centered on the
    drop point with id `<shape>-<Date.now()>-<counter>`,
    type `shape`, data `{ label: "", shape, color:
    "default" }`, default width/height, added via
    `onNodesChange([{ type: "add", item }])` from
    `useLiveblocksFlow` (writes into room storage; checked
    in `@liveblocks/react-flow`'s `applyNodeChanges`).
    `nodeTypes` defined once at module level.
  - `app/globals.css` — `--xy-handle-background-color`
    mapped to `--muted-foreground`.
  - Two small additions beyond the spec text, both noted in
    Architecture Decisions: `connectionMode` is `Loose`
    (needed for the side handles to connect), and the
    minimap is hidden below `sm` (it overlapped the centered
    panel on phone widths).
  - Verified: `tsc`, `eslint`, `npm run build` pass. A tsx
    script checked `parseShapeDragPayload` (valid
    rectangle/hexagon accepted; unknown shape, `toString`,
    negative or string sizes, invalid JSON, empty, `null`,
    arrays rejected) and that `getCanvasShape` /
    `getNodeColorClasses` ignore prototype keys. Built CSS
    contains `fill-card`, `stroke-input`, `stroke-primary`,
    `fill-none`, `text-card-foreground`, `sm:block` and the
    handle variable.
  - Not verified (needs a browser and two Clerk accounts):
    the panel rendering, drag-and-drop placing the node at
    the drop point, the shapes' look, real-time sync to a
    collaborator, and selecting/dragging nodes syncing.
    HTML5 drag-and-drop does not work on touch screens, and
    Firefox has historically not started drags from
    `<button draggable>`; check Firefox in the browser test.
  - Browser-verified by the owner (2026-10-10, Edge + VS Code
    browser, two Clerk accounts): canvas connects via
    `/api/liveblocks-auth` (200); shape panel renders; a
    diamond dropped by the owner appeared for the
    collaborator in real time. Each user keeps their own
    viewport, so the same node sits at different screen
    positions. Firefox and edge connections not checked.

- 13 Canvas Layout and Drag Preview (2026-10-10,
  spec: `CONTEXT/FEATURE-SPECS/13-CANVAS-LAYOUT-AND-DRAG-PREVIEW.md`):
  - `hooks/use-ai-sidebar-state.ts` — `useAiSidebarState()`
    (owned by `EditorShell`): `isOpen`, `followsScreenSize`,
    `toggle`. Until the user toggles, the state follows a
    `(min-width: 64rem)` media query (Tailwind `lg`) via
    `useSyncExternalStore`; the server renders the desktop
    (open) state.
  - `components/editor/ai-sidebar-context.ts` —
    `AiSidebarContext` + `useAiSidebarVisibility()`, so the
    workspace page reads the state the navbar toggles.
  - `components/editor/ai-sidebar.tsx` (`'use client'`
    entry) — the AI chat placeholder as a floating panel:
    `absolute inset-y-2 right-2 z-20 w-80`, `rounded-xl`,
    `bg-sidebar`, `shadow-lg`, like the project sidebar.
    Slides off-screen via `translate-x` and is `inert` when
    closed. While it follows the screen size its position
    comes from CSS (`lg:translate-x-0`), so the first paint
    is right on phones and desktops with no slide-in flash.
    `z-20` keeps it under the project sidebar's mobile scrim
    (`z-30`) and the project sidebar (`z-40`).
  - `components/editor/project-workspace.tsx` — the canvas
    section fills the whole area under the navbar; the AI
    sidebar floats over it. It is no longer hidden below
    `md` (closed by default there instead).
  - `components/editor/editor-navbar.tsx` — AI sidebar
    toggle (`PanelRightOpen` / `PanelRightClose`, ghost icon
    button, `aria-label` "Open AI sidebar" / "Close AI
    sidebar", `aria-expanded`) before `Share`, in workspaces
    only. The `Share` label is `sr-only` below `sm` (icon
    only, accessible name unchanged) so the right section
    still fits on a 375 px phone with the extra button.
  - `components/canvas/shape-outline.tsx` — `ShapeOutline`
    moved here unchanged from `shape-node.tsx`; the node and
    the drag preview both import it.
  - `components/canvas/shape-drag-preview.tsx` —
    `setShapeDragImage(dataTransfer, payload)`: renders the
    shape's outline at 60% of its default size into a
    temporary off-screen `<div>` (own React root,
    `flushSync`), calls `setDragImage` with the offset at
    the outline's center (matching how the drop centers the
    node), and unmounts + removes the element in a
    `setTimeout` after dragstart. Preview paint: node fill +
    `stroke-primary` (the default `stroke-input` is 15%
    white and nearly vanishes once the browser fades the
    drag image). Called from the panel's `startShapeDrag`;
    the drag payload and drop handling are unchanged.
  - Verified: `tsc`, `eslint`, `npm run build` pass. Built
    CSS contains every new class (`-top-[9999px]`,
    `lg:translate-x-0`, `translate-x-[calc(100%+0.5rem)]`,
    `max-sm:sr-only`, ...). A tsx script rendered
    `ShapeOutline` for all six shapes at preview size.
  - Not verified (needs a browser signed in with Clerk): the
    drag image itself in each browser, the sidebar sliding
    and toggling, the default state on a phone vs desktop,
    and drop-and-sync still working. Off-screen drag-image
    elements are known to work in Chromium and Firefox;
    Safari is the one to watch.
  - Known: while the AI sidebar is open it covers the
    bottom-right minimap; feature 17 removes the minimap.

- 14 Node Editing (2026-10-10,
  spec: `CONTEXT/FEATURE-SPECS/14-NODE-EDITING.md`):
  - `lib/canvas-shapes.ts` — `MIN_NODE_WIDTH` (60) and
    `MIN_NODE_HEIGHT` (40).
  - `components/canvas/shape-node.tsx` — React Flow
    `NodeResizer`, visible only when the node is selected,
    with those minimums: side lines resize one dimension,
    corner handles both. Rendered after the outline and
    label and before the connection handles, so the handles
    stay on top at the side midpoints. `lineClassName`
    `before:absolute before:-inset-1` widens each 1px side
    line into a ~9px grab strip. The resizer's `dimensions`
    (`setAttributes`) and `position` changes go straight to
    `useLiveblocksFlow`'s `onNodesChange`, which writes
    `width` / `height` / `position` to room storage (checked
    in `@liveblocks/react-flow`'s `applyNodeChanges`); the
    outline already draws from the node's `width` /
    `height`. No local size state.
  - Double-click on a node starts editing (`isEditing` is the
    only local state). The label and the editor share one
    layout (`LABEL_TEXT_CLASSES`: `m-auto max-w-full
    text-center text-sm break-words whitespace-pre-wrap`
    inside an `absolute inset-0 flex overflow-hidden p-4`
    wrapper), so the text sits in the same centered spot
    while typing, wraps inside the node and is clipped
    rather than overflowing. `m-auto` (not
    `items-center`) keeps the first line reachable if the
    text grows taller than the node. Labels now keep their
    line breaks (`whitespace-pre-wrap`).
  - `components/canvas/node-label-editor.tsx` —
    `NodeLabelEditor`: `contentEditable="plaintext-only"`
    (pasted formatting dropped), `role="textbox"`,
    `aria-label` "Node label". Text set through the DOM on
    mount (read once, so a collaborator's rename doesn't
    reset the draft), focused, whole label selected. Enter
    commits (ignored while an IME is composing),
    Shift+Enter inserts a line, Escape cancels, blur
    commits. An `isDoneRef` guard reports each edit exactly
    once, so the blur that can follow Enter/Escape
    unmounting the editor does nothing. Label is
    `innerText.trim()`; empty is allowed.
    `nodrag` (dragging selects text) and `nokey` + the
    `contenteditable` attribute (React Flow's
    `isInputDOMNode` check) keep Backspace/Delete/arrows from
    reaching canvas shortcuts.
  - Commit calls `updateNodeData(id, { label })` from
    `useReactFlow<CanvasNode, CanvasEdge>()` (typed from
    `CanvasNodeData`), only when the label changed. In a
    controlled flow React Flow turns that into a `replace`
    change sent to `onNodesChange`, which Liveblocks
    `reconcile`s into storage (`data` syncs; `selected` /
    `measured` stay local). Cancel writes nothing, so the
    previous label just shows again.
  - `app/globals.css` — `--xy-resize-background-color`
    mapped to `--primary` (matches the selected outline).
  - Verified: `tsc`, `eslint`, `npm run build` pass. Built
    CSS contains `min-h-[1lh]`, `before:-inset-1`,
    `whitespace-pre-wrap`, `select-text` and the resize
    variable. Double-click on a node does not zoom the
    canvas (draggable nodes carry `nopan`, which React
    Flow's zoom filter skips).
  - Not verified (needs a browser signed in with Clerk; a
    headless-browser harness was not run): resize handles
    on the selected node only, side vs corner resizing and
    the 60×40 floor, resize and label sync to a
    collaborator, text centered while typing,
    Enter/click-outside/Escape/Shift+Enter, Backspace
    editing text instead of deleting the node, and
    `plaintext-only` in Firefox (supported since Firefox
    136).
  - Browser-checked by the owner (2026-10-10, Edge + VS Code
    browser, two accounts): selected nodes show resize
    handles, a resized rectangle synced to the other
    window, and a label typed in a diamond showed centered
    in both windows. The `[React Flow]` error002 warning
    in the dev terminal came from hot reload swapping in
    the edited `ShapeNode` (React Flow compares the
    `nodeTypes` entries across renders); dev only.
    Second check: Shift+Enter gave a three-line label in a
    circle, centered and wrapped inside the node; the
    diamond's edited label ("rtregd") synced to both
    windows. The two error002 warnings were one per open
    window after a single hot reload. Escape and
    Backspace-while-typing not yet reported. While editing,
    the browser's spell-check underlines words (red
    squiggles); the spec doesn't cover it.

- 15 Node Color Toolbar (2026-10-10,
  spec: `CONTEXT/FEATURE-SPECS/15-NODE-COLOR-TOOLBAR.md`):
  - `app/globals.css` — 21 node color tokens in `:root`
    (`--node-<color>`, `--node-<color>-border`,
    `--node-<color>-foreground` for blue, green, purple,
    orange, red, yellow, teal), exposed in `@theme inline`
    as `--color-node-*`. `default` reuses `--card` /
    `--input` / `--card-foreground`; red's outline reuses
    `--destructive`. Contrast checked with a script (WCAG,
    oklch → sRGB): text on fill 10.1–10.6:1, outline on the
    canvas 6.5–11.4:1, all values inside sRGB except the
    reused `--destructive`.
  - `lib/canvas-colors.ts` — `NODE_COLORS` now has all 8
    colors in toolbar order, each with `label`, `fill`,
    `stroke`, `text` and `swatch` classes written out in
    full (Tailwind scans the file). New `isNodeColor()`;
    `getNodeColorClasses()` uses it (unknown keys still
    fall back to `default`).
  - `components/canvas/node-color-toolbar.tsx` —
    `NodeColorToolbar` (`currentColor`, `onSelectColor`):
    React Flow `NodeToolbar` at `Position.Top`, left to its
    default visibility (only while its node is the one
    selected node). Pill styled like the shape panel,
    `role="group"` `aria-label` "Node color". One `<button>`
    per color: `aria-label` and `title` = color name,
    `aria-pressed` on the current one, which also shows a
    `Check` in the color's text color; Tab / Enter / Space
    work as normal buttons. `nopan` keeps a press on a
    swatch from panning the canvas; `nokey` keeps Space,
    arrows and Backspace pressed on a swatch from reaching
    React Flow (pan, move node, delete node).
  - `components/canvas/shape-node.tsx` — renders the
    toolbar (not while `isEditing`) as a sibling of the node
    body, not inside it: the toolbar is portaled, but React
    events still bubble through the React tree, so inside
    the body a double-click on two swatches would start a
    label edit. Picking a color calls
    `updateNodeData(id, { color })` with the key only (no
    write when unchanged), the same synced path as labels.
    Selected nodes now keep their color's outline (2px
    instead of 1.5px) instead of switching to
    `stroke-primary`, so the outline change shows at once
    for the person picking; the resize frame (`--primary`)
    still marks the selection.
  - `CONTEXT/ui-context.md` — node color palette table,
    toolbar description, updated selected-outline rule.
  - Verified: `tsc`, `eslint`, `npm run build` pass. Built
    CSS contains every `fill-/stroke-/text-/bg-/border-node-*`
    class and all 21 tokens. Checked in the React Flow
    source: clicks on the toolbar don't reach the pane's
    deselect handler (it only acts when the pane itself is
    the target) and a click on a swatch is a no-op for the
    node's own select handler (already selected).
  - Not verified (needs a browser signed in with Clerk): the
    toolbar appearing above a selected node and hiding on
    deselect, multi-select and while editing; colors
    changing on click; the change reaching a collaborator;
    keyboard use of the swatches.

- 16 Edge Behavior (2026-10-10,
  spec: `CONTEXT/FEATURE-SPECS/16-EDGE-BEHAVIOR.md`):
  - `lib/canvas-types.ts` — `CanvasEdgeData` (`label`),
    `CanvasEdge` is now `Edge<CanvasEdgeData>`, and
    `LABELED_EDGE_TYPE` (`"labeled"`).
  - `components/canvas/labeled-edge.tsx` — `LabeledEdge`:
    `getBezierPath` from the edge's source/target positions
    (so it leaves and enters through the handles the
    connection used), `BaseEdge` with `interactionWidth` 24
    (the invisible hit area), stroke 1.5px, 2.5px when
    selected. Arrowhead: a closed-triangle `<marker>` per
    edge (`markerUnits="userSpaceOnUse"`, so the thicker
    selected stroke doesn't enlarge it) filled from
    `--xy-edge-stroke` / `--xy-edge-stroke-selected`, so it
    follows the selected color. Double-click on the path or
    the label box starts editing (`isEditing` is the only
    local state). The label sits at the path midpoint in
    `EdgeLabelRenderer` (`rounded-md border-border bg-card
    text-xs`, `nodrag nopan pointer-events-auto`); no box
    when the label is empty and not being edited. Commit
    calls `updateEdgeData(id, { label })` only when the
    label changed: React Flow turns it into a `replace`
    change sent to `onEdgesChange`, which Liveblocks
    `reconcile`s into storage (checked in
    `@liveblocks/react-flow`'s `applyEdgeChanges`; `data`
    syncs, `selected` stays local). Edges made before this
    feature have no `data` and read as an empty label.
  - `components/canvas/label-editor.tsx` — renamed from
    `node-label-editor.tsx` (`NodeLabelEditor` →
    `LabelEditor`) so nodes and edges share it, with a new
    `ariaLabel` prop ("Node label" / "Edge label"). Same
    Enter / Shift+Enter / Escape / blur rules and the same
    `isDoneRef` guard (one commit per edit). New:
    `stopPropagation()` on keydown, because React Flow's
    edge wrapper handles Enter/Space/Escape (select /
    deselect the edge) and, unlike the node wrapper, does
    not skip text fields; the label box is a React child of
    that wrapper even though it is portaled.
  - `components/canvas/canvas.tsx` — `edgeTypes`
    (`labeled` → `LabeledEdge`, module level),
    `defaultEdgeOptions` `{ type: "labeled", data: { label:
    "" } }` (React Flow merges these into the connection
    before calling Liveblocks' `onConnect`, which builds the
    edge with `addEdge`; checked in both sources),
    `isValidConnection` rejecting `source === target`, and
    `deleteKeyCode` `["Delete", "Backspace"]` (React Flow's
    default is Backspace only). Deletion was already wired:
    React Flow's delete adds a deleted node's connected
    edges and calls `onDelete`, which removes nodes and
    edges from room storage. The delete key is ignored while
    focus is in a `contenteditable` / `.nokey` element.
  - `app/globals.css` — `--xy-edge-stroke` →
    `--muted-foreground`, `--xy-edge-stroke-selected` →
    `--primary` (also colors the line drawn while
    connecting).
  - `CONTEXT/ui-context.md` (Edges), `CONTEXT/architecture.md`
    (`canvas-types.ts` contents) updated.
  - Verified: `tsc`, `eslint`, `npm run build` pass. Built
    CSS contains `fill-(--xy-edge-stroke)`,
    `fill-(--xy-edge-stroke-selected)`, `pointer-events-auto`,
    `min-w-12`, `max-w-48` and both edge variables. Checked
    in the React Flow source: edge wrappers carry `nopan`,
    so double-clicking an edge does not zoom the canvas.
  - Not verified (needs a browser signed in with Clerk; no
    headless harness was run): connecting each side to each
    side, self-connection refused, edge selection and the
    hit area, label edit Enter/Escape/click-outside and the
    single sync per edit, Delete/Backspace removing nodes
    with their edges and syncing to a collaborator.
  - Known: edges drawn before this feature keep React
    Flow's default edge type (gray, no arrowhead, no
    labels); delete and redraw them. The spec only changes
    new connections.

- 17 Canvas Ergonomics (2026-10-10,
  spec: `CONTEXT/FEATURE-SPECS/17-CANVAS-ERGONOMICS.md`):
  - `hooks/use-canvas-actions.ts` — `useCanvasActions()`:
    `zoomIn` / `zoomOut` / `fitView` (React Flow,
    200 ms animation) and `undo` / `redo` from Liveblocks
    (`useUndo` / `useRedo`, the room history). Memoized so
    the shortcut listener isn't re-attached on every render.
  - Room history checked in `@liveblocks/react-flow`'s
    `applyNodeChanges`: it pauses history when a drag or
    resize starts and resumes when it ends, so a whole move
    or resize is one undo step. Adds, deletes (`onDelete` is
    one mutation), labels and colors (`updateNodeData` →
    one `replace` mutation) are one step each. Selection,
    measured size and dragging flags use `setLocal`, which
    never enters the history. Undo only reverses this user's
    own changes (Liveblocks history is per client).
  - `hooks/use-canvas-shortcuts.ts` — `useCanvasShortcuts()`
    (called in `CanvasFlow`): one `keydown` listener on
    `document`. `+` / `=` zoom in, `-` zoom out (only without
    Ctrl/Cmd, so the browser's own Ctrl/Cmd +/- page zoom
    still works), Ctrl/Cmd+Z undo, Ctrl/Cmd+Y and
    Ctrl/Cmd+Shift+Z redo; any Alt combination is ignored
    (AltGr reports Ctrl+Alt). Skipped when the event was
    already handled or its target is an `input`, `textarea`,
    `select` or contenteditable element (label editors,
    dialogs, later the chat). Handled keys `preventDefault()`.
  - `components/canvas/canvas-controls.tsx` —
    `CanvasControls`: React Flow `Panel` at `bottom-left`,
    same pill as the shape panel, `role="group"`
    `aria-label="Canvas controls"`, `nokey` (Space /
    Backspace on a focused button don't pan or delete).
    Buttons: zoom out, zoom in, fit view (`Maximize`), a
    divider, undo (`Undo2`), redo (`Redo2`). Each is a Base
    UI `Button` rendered through a shadcn `TooltipTrigger`,
    with `aria-label` and a tooltip "Undo (Ctrl+Z)" etc.
    (`⌘` on Apple devices). Undo/redo are disabled from
    `useCanUndo` / `useCanRedo` with `focusableWhenDisabled`:
    `aria-disabled`, dimmed, clicks blocked, but still
    hoverable (tooltip) and focus isn't dropped when the
    last undo disables the button under it.
  - Placement: below `md` the bar is lifted above the shape
    panel (`-translate-y-[calc(3.5rem+2px)]`), since a 375 px
    phone can't fit both on one row (side by side needs
    ~734 px). While the project sidebar is open, from `md`
    up the bar slides right of it (`translate-x-[18.5rem]`,
    animated like the sidebar), and below 83rem (where the
    shifted bar would reach the shape panel) it is also
    lifted. The AI sidebar is on the right, so it never
    covers the bar except on phones, where an open sidebar
    covers nearly the whole canvas anyway (same for the
    project sidebar and its scrim).
  - `components/editor/project-sidebar-context.ts` —
    `ProjectSidebarContext` + `useProjectSidebarVisibility()`
    (`{ isOpen }`), provided by `EditorShell`, so the canvas
    can read the sidebar state the navbar toggles (same
    pattern as `AiSidebarContext`).
  - Minimap removed: `MiniMap` from `canvas.tsx` and the four
    `--xy-minimap-*` overrides from `app/globals.css`.
  - Added shadcn `tooltip` via the CLI
    (`components/ui/tooltip.tsx`, Base UI; no new
    dependencies). Its `TooltipProvider` wraps only the
    control bar (the CLI suggests the root layout; nothing
    else uses tooltips yet).
  - `CONTEXT/ui-context.md` (Canvas, new Canvas control bar
    entry) and `CONTEXT/architecture.md` (`hooks/`) updated.
  - Verified: `tsc`, `eslint`, `npm run build` pass. Built
    CSS contains the placement classes
    (`max-md:-translate-y-[…]`, `max-[83rem]:-translate-y-[…]`,
    `md:translate-x-[18.5rem]`), `hover:not-data-disabled:bg-accent`
    and `data-disabled:opacity-50`; no app `--xy-minimap-*`
    overrides remain (React Flow's own `base.css` still
    defines its defaults). A server render of a control
    button showed `aria-label`, and when disabled
    `aria-disabled="true"` + `data-disabled` with no
    `disabled` attribute (still focusable).
  - Not verified (needs a browser signed in with Clerk; no
    headless harness was run): the buttons and shortcuts
    themselves, undo/redo of moves, adds, deletes, resizes,
    labels and colors, shortcuts doing nothing while typing a
    label, tooltips, and the bar's position with the project
    sidebar open and on a phone.

- 18 Starter Templates (2026-10-10,
  spec: `CONTEXT/FEATURE-SPECS/18-STARTER-TEMPLATES.md`):
  - `lib/canvas-templates.ts` — `CanvasTemplate` (`id`,
    `name`, one-line `description`, `nodes: CanvasNode[]`,
    `edges: CanvasEdge[]`) and `CANVAS_TEMPLATES`:
    Microservices (10 nodes / 10 edges), CI/CD pipeline
    (9 / 8), Event-driven system (11 / 10), Three-tier web
    app (9 / 8). Built with `node()` / `edge()` helpers:
    shape names from `canvas-shapes.ts` at their default
    sizes, color keys from `canvas-colors.ts`, columns 280
    apart left to right, nodes placed by center, every edge
    a `labeled` edge with a label and explicit side handles
    (`right` → `left` unless a node sits directly below).
    One color convention across templates (clients blue,
    routing purple, services green, storage orange, queues
    / checks yellow, environments teal, external / failure
    red). `instantiateTemplate()` copies a template with ids
    `<template node or edge id>-<randomUUID>` and rewires
    edges to the new node ids.
  - `components/canvas/template-preview.tsx` —
    `TemplatePreview`: SVG with a viewBox around the nodes
    (+24 padding), `ShapeOutline` per node in its color
    classes, edges via React Flow's `getBezierPath` from the
    handle sides, one arrowhead marker, non-scaling strokes.
    No labels.
  - `components/canvas/templates-dialog.tsx` —
    `TemplatesDialog` on `EditorDialog` (new `className`
    prop, merged with `cn`): wide, scrolls inside, `nokey`
    so Delete/Backspace in the dialog don't delete selected
    nodes behind it. Card grid (two columns from `lg`),
    `Import` per card. On a non-empty canvas a nested
    `EditorDialog` asks "Replace the canvas?" (Escape closes
    only it).
  - `hooks/use-template-import.ts` — `useTemplateImport()`:
    one `useMutation` that deletes every edge and node in
    `flow` storage, then calls the flow's own
    `onNodesChange` / `onEdgesChange` with `add` changes.
    Those are mutations too; nested Liveblocks batches join
    the outer one (checked in `@liveblocks/core`'s
    `batch`), so the import is one storage update for
    collaborators and one undo step. Then `fitView()` from
    `useCanvasActions`; React Flow queues it until the new
    nodes are measured (checked in its `fitViewQueued`
    logic). Only the importer's view moves.
  - `components/editor/templates-dialog-context.ts` —
    `TemplatesDialogContext` (`isOpen`, `setIsOpen`), owned
    by `EditorShell`; the navbar opens it and `Canvas`
    renders the dialog (it must be inside the room and the
    React Flow provider), outside `<ReactFlow>` so its
    events don't bubble into React Flow.
  - `components/editor/editor-navbar.tsx` — `Templates`
    button (workspaces only) in the left section, since the
    right section is full on phones.
  - `CONTEXT/ui-context.md` and `CONTEXT/architecture.md`
    updated.
  - Verified: `tsc`, `eslint`, `npm run build` pass; built
    CSS has the new classes. A tsx script checked each
    template: 6–12 nodes, valid shapes / colors / labels,
    no dangling or unlabeled edges, edges run left to right,
    nodes at least 40 apart, no edge label on a node or
    another label, fresh ids on every instantiation with
    edges rewired to them, copies don't share objects with
    the template. Static render of every preview: all nodes and
    edges drawn, no NaN.
  - Browser-verified by the owner (2026-10-10, Edge + VS Code
    browser, two accounts): the Templates button opens the
    wide dialog with whole-diagram previews; importing Three-
    tier web app placed it, fitted the view, and appeared in
    the collaborator's window; undo was enabled for the
    importer only (history is per user).
  - Not yet checked in the browser: the replace confirmation
    on a non-empty canvas and undo restoring the previous
    canvas.

- 19 Presence: Avatars and Cursors (2026-10-10,
  spec: `CONTEXT/FEATURE-SPECS/19-PRESENCE-AVATARS-CURSORS.md`):
  - `components/canvas/collaborator-cursors.tsx` —
    `CollaboratorCursors`: Liveblocks' `<Cursors>` from
    `@liveblocks/react-flow` (checked in its source): it
    listens for `pointermove` on the React Flow element,
    writes `screenToFlowPosition` of the pointer to the
    `cursor` presence (throttled by the Liveblocks client,
    default 100 ms, smoothed by a spring on the receiving
    side), sets it to null on `pointerleave` and window
    blur, and places each other connection's cursor at
    flow × zoom + pan, re-placed on every pan/zoom. Lists
    other connections only (`useOthersConnectionIds`), so
    your own cursor is never drawn and a leaver's goes.
    Its default cursor needs `resolveUsers`, so a custom
    `CollaboratorCursor` reads name and color from
    `useOther(connectionId, other => other.info)` (the
    token's user info) and draws an SVG pointer arrow
    (`fill` = user color, `stroke-foreground`) with the
    name on a pill in that color (`text-background`).
    Overlay `absolute inset-0 z-5 pointer-events-none`:
    above the nodes (React Flow's renderer is z-4), never
    blocks clicks; rendered last in `<ReactFlow>`. No
    Liveblocks stylesheet imported; the classes are ours.
  - `components/editor/presence-avatars.tsx` —
    `PresenceAvatars`: you plus everyone else, one avatar
    per user id (the same user in two tabs shows once),
    you first. `useSelf` / `useOthersMapped` select only
    id + info with `shallow`, so cursor moves don't
    re-render it. shadcn `Avatar` with the Clerk image, or
    initials (first + last word) on a circle in the user's
    color; `ring-2` in that color with a `ring-offset-2`
    background gap; overlapping `-ml-2`. Tooltip (bottom)
    with the name, "(you)" for yourself; each avatar is
    `role="img"` with that label. At most 4 avatars then a
    `+N` circle from `lg`; 2 then `+N` between `md` and
    `lg`; hidden below `md` (see Open Questions).
  - Navbar placement: the navbar is outside the room (the
    `RoomProvider` is in the workspace page, after the
    access check), so `EditorShell` keeps a slot element in
    state and passes it through
    `components/editor/presence-slot-context.ts`
    (`PresenceSlotContext`); the navbar's
    `WorkspaceActions` renders the slot (`display:
    contents`) before the AI sidebar toggle, and
    `CanvasRoom` portals `PresenceAvatars` into it behind
    its own `ClientSideSuspense` (`fallback={null}`). So the
    stack shows only once the room is connected, never on
    the editor home, not on a room connection error, and
    goes away when you leave the workspace.
  - Cursor colors stay the `USER_COLORS` hex values from the
    auth token; components get them as a `--user-color` CSS
    variable and use `fill-` / `bg-` / `ring-(--user-color)`.
  - `CONTEXT/ui-context.md` and `CONTEXT/architecture.md`
    updated.
  - Verified: `tsc`, `eslint`, `npm run build` pass; built
    CSS has the new classes (`ring-(--user-color)`,
    `not-first:-ml-2`, `z-5`, …). Not yet checked with two
    users in the browser.

- 20 AI Sidebar Shell (2026-10-10,
  spec: `CONTEXT/FEATURE-SPECS/20-AI-SIDEBAR-SHELL.md`):
  UI only; no AI calls, API routes or persistence.
  - `hooks/use-ai-chat.ts` — `useAiChat()`: `messages`
    (`AiChatMessage`: `id`, `role` user/assistant,
    `content`), `draft`, `setDraft`, `canSend` (false for
    blank text) and `send()`, which appends the trimmed user
    message plus the placeholder reply "AI design generation
    is coming soon." and clears the draft. Called in
    `AiSidebar`, not in the tab panel: Base UI unmounts
    inactive tab panels, and the chat and draft must survive
    switching tabs. Local state only, so it resets when the
    workspace remounts.
  - `components/editor/ai-sidebar.tsx` — same floating,
    collapsible panel and navbar toggle as feature 13;
    `aria-label` is now "AI sidebar". Header holds shadcn
    `Tabs` (`AI Architect` / `Specs`, Lucide icons, tab list
    `aria-label` "AI sidebar sections"). `nokey` on the
    panel: React Flow ignores keys pressed anywhere in it
    (Space / Backspace on a focused sidebar button don't pan
    or delete). Each panel has `data-ending-style:hidden`:
    Base UI keeps the panel being left mounted (inert) until
    its exit transition ends, and without this both panels
    would share the height for a frame.
  - `components/editor/ai-chat-panel.tsx` — empty state
    (intro + four starter-prompt buttons that fill the
    composer and focus it) or the message list: `ScrollArea`
    filling the space above the composer, `role="log"`,
    user bubbles right, assistant bubbles left with a small
    `Sparkles` icon (`role="img"`, "AI Architect"). New
    messages scroll the ScrollArea's own viewport to the
    bottom (smooth), not `scrollIntoView`, which could also
    scroll the editor around it.
  - `components/editor/ai-chat-composer.tsx` — shadcn
    `Textarea` (`rows={1}`) + icon-only send button
    (`ArrowUp`, `aria-label` "Send message", disabled while
    blank). Enter sends (not during IME composition),
    Shift+Enter adds a line; the form's submit also sends.
    Auto-grows by setting its height from `scrollHeight` in
    a layout effect (`field-sizing-fixed`, so it works in
    browsers without `field-sizing: content`), capped at
    `max-h-[calc(6lh+1rem+2px)]` (six lines + padding +
    border), then scrolls. Exposes `focus()` through a ref
    handle for the starter prompts. Canvas shortcuts already
    skip keys typed in a textarea (`useCanvasShortcuts` and
    React Flow's `isInputDOMNode`), so no extra guard.
  - `components/editor/ai-specs-panel.tsx` — short intro,
    disabled `Generate spec` button described by "Spec
    generation is coming soon." (no toast library is
    installed, so the disabled state carries it), and an
    example spec card: title, "Generated" with a muted bar
    standing in for the date (a real date would differ
    between the server render and the client), five
    skeleton lines and a disabled `Download` button.
  - `CONTEXT/ui-context.md` (AI sidebar entry) and
    `CONTEXT/architecture.md` (`hooks/`) updated.
  - Verified: `tsc`, `eslint`, `npm run build` pass; built
    CSS has the new classes (`max-h-[calc(6lh+1rem+2px)]`,
    `field-sizing-fixed`, `wrap-break-word`,
    `data-ending-style:hidden`, …). A scripted test (jsdom
    in a scratch folder, not added to the project) rendered
    the real `AiSidebar` and passed 28 checks: both tabs and
    switching, four chips filling and focusing the composer,
    send disabled for empty and whitespace, Enter sends,
    Shift+Enter and IME Enter don't, send button sends
    trimmed multi-line text, the user + placeholder bubbles
    and their alignment, scroll-to-newest called, the Specs
    tab's disabled button, linked note and example card,
    chat and draft surviving a tab switch, and React Flow's
    key guard treating the composer and sidebar buttons as
    ignored.
  - Not verified (needs a browser signed in with Clerk): the
    look, the textarea growing to six lines then scrolling,
    smooth scrolling, and typing `-`, `+`, Backspace or
    Ctrl+Z in the composer with the canvas focused before.

- 21 Canvas Autosave (2026-10-10,
  spec: `CONTEXT/FEATURE-SPECS/21-CANVAS-AUTOSAVE.md`):
  - `@vercel/blob` 2.8.1 installed. `lib/canvas-storage.ts`
    (`server-only`): `saveCanvasSnapshot` writes
    `canvas/<projectId>.json` with `access: "private"`,
    `addRandomSuffix: false`, `allowOverwrite: true`;
    `loadCanvasSnapshot` reads it with
    `get(path, { access: "private", useCache: false })`
    (origin read, so a fresh save is never answered from
    cache) and validates it. The SDK takes
    `BLOB_READ_WRITE_TOKEN` from the environment.
  - `lib/canvas-snapshot.ts` (shared): the snapshot type
    `{ version: 1, savedAt, nodes, edges }` built on the
    canvas types, the 2 MB cap, structural validation of
    nodes (id, numeric position, data object) and edges
    (id, source, target, optional data object), and
    `toCanvasContent`, which drops local-only React Flow
    state (`selected`, `dragging`, `measured`, `resizing`)
    so selecting alone never counts as a change. Data
    fields are not checked one by one, so nodes saved
    before a field existed still load.
  - `lib/project-data.ts`: `getCanvasJsonPath` /
    `setCanvasJsonPath` (writes only when the path differs).
    `canvasJsonPath` stays out of every API response.
  - `lib/api-response.ts`: `readJsonObject` takes
    `maxBytes`; it rejects a too-large `Content-Length` and
    also counts bytes while streaming, so a body without
    (or with a wrong) length can't get past the cap.
  - `app/api/projects/[projectId]/canvas/route.ts`: `GET`
    returns the snapshot JSON (404 when none), `PUT`
    validates `{ nodes, edges }` (400 when invalid or over
    2 MB), writes the blob, stores the path and returns
    `{ version, savedAt }`. Signed out -> 401; not owner or
    collaborator, or unknown project -> 404; both roles may
    read and save. Blob failures -> 500 JSON, logged. No
    Blob URL is ever returned.
  - `lib/api-client.ts`: `sendJsonRequest` accepts `PUT`
    and `keepalive`, and throws `ApiRequestError` (with
    `status`) for error responses, so restore can tell "no
    snapshot" (404) from a failure.
  - `hooks/use-canvas-autosave.ts`: the save logic is a
    plain closure created once per mount (`useState`
    initializer) and never torn down, so strict mode's extra
    unmount/remount can't leave it dead; no `isMounted`
    guard. Saves ~3 s after the last change, at once on
    `Save`, and on `visibilitychange` (hidden), `pagehide`
    and unmount (leaving the workspace) when something is
    unsaved; those use `keepalive` when the body fits its
    64 KiB limit. Automatic saves skip content equal to the
    last successful save; the canvas counts as saved when
    autosave is enabled. One request at a time: requests
    during a save are merged into one follow-up save, and
    the status stays `Saving…` until it ends. `Saved`
    returns to `Save` after 2 s; `Save failed` stays until
    the next attempt.
  - `hooks/use-canvas-restore.ts`: if the room's flow is
    empty on load, fetches the snapshot (aborted on
    unmount, so strict mode's first request and stale
    responses are never applied) and adds its nodes and
    edges through the flow's `onNodesChange` /
    `onEdgesChange` in one mutation that first re-checks
    that storage is still empty, so a room that got content
    meanwhile is never overwritten. After a real restore the
    local undo history is cleared (undo must not empty the
    room, which autosave would then save). Autosave is
    enabled only after this check, so an empty room never
    overwrites the snapshot it is about to load. Failed
    lookups retry twice, 5 s apart, then autosave starts
    anyway.
  - `components/editor/save-button.tsx` +
    `save-slot-context.ts`: the Save button with its status
    (see `ui-context.md`), rendered by the canvas and
    portaled into a navbar slot in the left section, like
    the avatar stack. `Canvas` now takes `projectId`.
  - `CONTEXT/architecture.md` and `CONTEXT/ui-context.md`
    updated.
  - Verified: `tsc`, `eslint`, `npm run build` pass. On
    `next start`, signed-out `GET` and `PUT` return 401
    JSON. Scripted tests (jsdom in a scratch folder, not
    added to the project): the real autosave hook in
    `StrictMode` with a fake server passed 35 checks
    (nothing sent while disabled or on enable; one PUT
    ~3 s after the last change with local fields stripped;
    selection alone sends nothing; three clicks in a row
    each send a PUT and go `Saving…` -> `Saved`; `Saved` ->
    `Save` after 2 s; failure -> `Save failed`, stays, click
    retries; only one request in flight, clicks during it
    become one follow-up; a change during a save saves again
    after it; hidden/pagehide send a keepalive save only
    when something is unsaved; unmount saves unsaved
    changes; nothing after unmount). The real restore hook
    against a fake room passed 15 checks (restores once
    under strict mode and clears history; 404 leaves the
    room empty; a non-empty room makes no request; content
    added while loading is kept, the snapshot skipped and
    the history left alone; unmount before the response
    applies nothing; 500 retries twice then gives up).
    Validation and the body cap passed 26 checks (exactly
    2 MB accepted, over 2 MB rejected with and without
    `Content-Length`, multibyte counted as bytes, bad
    nodes/edges rejected, older nodes accepted).
  - Not verified (needs a signed-in browser and the Blob
    token, which agents don't read): a real save appearing
    as `canvas/<projectId>.json` in the Blob store and being
    overwritten, a non-member's 404, and restoring into an
    empty room.

- 22 Trigger.dev Setup (2026-10-11,
  spec: `CONTEXT/FEATURE-SPECS/22-TRIGGER-SETUP.md`):
  - Installed `@trigger.dev/sdk` 4.7.3, and as dev
    dependencies `@trigger.dev/build` 4.7.3 and the
    `trigger.dev` CLI 4.7.3 (not named in the spec; the
    `trigger:dev` script needs the CLI binary, and the docs
    say to keep CLI, SDK and build on one version). No
    Trigger.dev agent skill was installed, so the docs and
    skills bundled in the SDK/CLI packages were used.
  - `trigger.config.ts`: `project` from
    `TRIGGER_PROJECT_REF`, `runtime: "node"`,
    `dirs: ["./trigger"]`, `maxDuration: 3600`, retries
    `{ maxAttempts: 3, factor: 2, minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000, randomize: true }` with
    `enabledInDev: true` (the SDK default, set explicitly),
    and `prismaExtension({ mode: "modern" })` — the mode the
    SDK docs give for Prisma 7's `prisma-client` generator
    with a driver adapter.
  - `trigger/design-agent.ts` (`designAgent`, id
    `design-agent`, payload `DesignAgentPayload`) and
    `trigger/spec-generator.ts` (`specGenerator`, id
    `spec-generator`, payload `SpecGeneratorPayload`): log
    the payload with `logger.log` and return it.
  - `package.json`: `"trigger:dev": "trigger dev"` (fixed
    2026-10-11: it first said `trigger.dev dev`, which fails on
    Windows — the installed CLI binary is named `trigger`). The
    installed CLI loads `.env`, `.env.development`,
    `.env.local`, `.env.development.local` from the project
    folder by default (checked in its source,
    `utilities/dotEnv.js`), and reads `TRIGGER_PROJECT_REF`
    from them as the project ref for `dev` and `deploy`, so
    no `--env-file` flag is needed.
  - `.gitignore`: `.trigger/`.
  - `CONTEXT/architecture.md`: `trigger/` and
    `trigger.config.ts` described; new "Local Development"
    section (two terminals, env loading, production task
    env vars set in the Trigger.dev dashboard).
  - Verified: `tsc`, `eslint`, `npm run build` pass. The
    CLI's own `loadConfig` + `buildWorker` (run offline
    from a scratch script with a dummy project ref; no
    login, no env files) resolved the config as above and
    bundled both tasks. A throwaway probe task (in
    `trigger/` only for that run, then deleted) importing
    `lib/prisma`, `lib/project-data` and
    `lib/canvas-storage` bundled too: `server-only` was
    stubbed by the CLI and `@prisma/client` kept external;
    loading the bundled files with Node exported
    `design-agent`, `spec-generator` and the probe. No
    `.env*` file was read or edited.
  - Not verified (needs the owner's Trigger.dev login):
    `npm run trigger:dev` connecting and both tasks showing
    in the dashboard.

## In Progress

- None.

## Next Up

- AI design generation (23–26)

## Open Questions

- Canvas snapshots when a project is deleted (feature 21):
  deleting a project removes its row but not
  `canvas/<projectId>.json` in Blob, so the blob is left
  behind. The spec doesn't cover deletion; say if the
  delete route should remove it too.
- `Save` with nothing changed (feature 21): the spec's
  "skip saving when nothing changed" is applied to the
  automatic saves (debounce, page hide, leaving); a click
  always saves, so `Save` visibly works every time and
  also stores a room that existed before autosave and
  hasn't been edited since. Say if a click should skip
  unchanged content too.

- Avatar stack on small screens (feature 19): the navbar's
  right section is already full on a 375 px phone, so the
  stack is hidden below `md` and shows at most 2 avatars
  (then `+N`) between `md` and `lg`; the spec's 4 applies
  from `lg`. Cursors show at every size. Say if phones
  should get a compact version instead.

- `pg` logs a security warning on connect: the
  `DATABASE_URL` uses `sslmode=require` (or `prefer` /
  `verify-ca`), which pg 8 treats as `verify-full` but pg 9
  will downgrade to libpq semantics. Owner can set
  `sslmode=verify-full` in `.env.local` (and on Vercel) to
  keep today's behavior and silence it. Agents can't edit
  that file.

- Auth redirects live on `ClerkProvider` props, not in
  `.env.local`: reading `.env.local` was blocked this
  session, so whether `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
  / `..._SIGN_UP_FALLBACK_REDIRECT_URL` already exist could
  not be checked. Clerk v7 has no env var for the
  after-sign-out URL, so that one is a provider option
  regardless. If the env vars are preferred, add them and
  drop the two fallback props.
- Clerk 7.9 logs a deprecation warning for `createRouteMatcher`
  (used in `proxy.ts`, as the 03 spec requires): it will be
  removed in Clerk's next major, and Clerk recommends
  per-page/route `auth()` checks instead. Works today. API
  routes now do their own `auth()` checks (feature 06); the
  editor layout still relies on `proxy.ts`.
- Clerk dev instance: a signed-out browser *navigation* to an
  `/api` URL (e.g. typing it in the address bar) gets Clerk's
  dev-browser handshake redirect before the handler runs.
  `fetch` / curl requests get the handler's 401 JSON. Comes
  from Clerk's development-instance cookie sync, not the app;
  expected to go away on a production Clerk instance
  (not verified).
- Theme palette: the spec said to match "the existing dark
  theme in `globals.css`", but none existed. shadcn's neutral
  dark palette is used and is now documented in
  `ui-context.md`. If a brand palette is chosen, replace the
  `:root` tokens in `app/globals.css` and the table in
  `ui-context.md` together.
- Context docs filled in (2026-10-10) from the build video's
  walkthrough: `project-overview.md`, `architecture.md`,
  `ui-context.md`, `code-standards.md`,
  `ai-workflow-rules.md`. They are a reconstruction, not the
  creator's original files (those come in his downloadable
  kit). Exact palette hex values were not given in the
  video, so `ui-context.md` documents the current
  `globals.css` tokens; swap in a brand palette there and in
  `globals.css` together if one is chosen.

## Architecture Decisions

- No `build.conditions: ["react-server"]` in
  `trigger.config.ts` to make `server-only` importable: the
  CLI's bundler already replaces `server-only` with a stub
  (its built-in "polyshed" plugin), and a custom condition
  would also be passed to Node at runtime and change how
  every package resolves.
- On Windows the dev CLI logs (debug level only) that it
  could not symlink `@prisma/client` into its build folder
  (`EPERM`; symlinks need Developer Mode). Harmless: the
  build folder is inside the project (`.trigger/`), so Node
  finds `@prisma/client` in the project's `node_modules`
  (confirmed by loading the bundle).

- Canvas snapshots are read and written only by the canvas
  route on the server (private Blob, token server-side);
  Liveblocks stays the live source of truth and the
  snapshot is a copy. Why: the spec keeps Blob URLs and the
  token out of the browser, and later AI/spec features read
  the snapshot, not the room.
- Autosave starts only after the restore check. Why: an
  empty room that is about to be restored would otherwise
  save the empty canvas over the snapshot.
- The Save button is portaled into a navbar slot
  (`SaveSlotContext`), like the avatar stack. Why: saving
  needs the room's nodes and edges, which only exist inside
  the canvas, while the navbar is in the shared editor
  layout. It sits in the left section because the right one
  is full on phones.

- Template import is one Liveblocks mutation that clears
  `flow` and adds through `useLiveblocksFlow`'s handlers.
  Why: the spec requires one undoable, synced change, and
  the flow's handlers stay the only code that converts nodes
  and edges to storage. AI generation can reuse
  `useTemplateImport`'s pattern.

- Undo/redo use the Liveblocks room history (`useUndo` /
  `useRedo`), never a local history. Why: the spec requires
  it, and every canvas write already goes through
  `useLiveblocksFlow`, which groups drags and resizes into
  one history step. New canvas writes (templates, AI
  output) should go through storage mutations too, so they
  are undoable the same way.
- The control bar and the keyboard shortcuts call the same
  `useCanvasActions()`. Why: one place for zoom/fit
  animation and undo/redo behavior, so a button and its
  shortcut can't drift.
- The project sidebar's open state reaches the canvas
  through `ProjectSidebarContext`. Why: the spec says the
  bar must not be covered by either sidebar; the project
  sidebar floats over the canvas's left edge, so the bar
  moves right while it is open, and the state lives in
  `EditorShell` (the navbar toggles it).

- Edge labels live in `data.label` (`CanvasEdgeData`), not
  React Flow's top-level `label`, and are edited with
  `updateEdgeData`. Why: the spec defines the edge data
  type with `label`, and it uses the same synced
  `onEdgesChange` path as node labels.
- One `LabelEditor` serves node and edge labels. Why: the
  commit-once rule and key handling must be identical for
  both; two copies would drift.
- Edge colors come from React Flow's `--xy-edge-*` variables
  mapped to tokens in `globals.css`; the arrowhead reads the
  same variables. Why: same rule as the other React Flow
  colors, and the arrow matches the path in both states.

- Selected nodes are marked by the resize frame, not by a
  `stroke-primary` outline: the node keeps its color's
  outline (thicker) while selected. Why: the color toolbar
  only shows on a selected node, so with a primary outline
  a picked outline color would only appear after
  deselecting, and spec 15 requires fill, outline and text
  to change immediately.
- Node colors are design tokens (`--node-*` in
  `globals.css`), and node data stores only the key. Why:
  colors stay themeable in one place, and stored canvases
  (snapshots, templates, AI output) never carry hex values.

- Node edits go through React Flow's own APIs, not direct
  Liveblocks mutations: `NodeResizer` emits node changes
  and labels use `updateNodeData`, both of which reach
  `useLiveblocksFlow`'s `onNodesChange`. Why: the flow stays
  the single write path into room storage, and later node
  edits (feature 15 colors) can use `updateNodeData` the
  same way.

- The AI sidebar's open state lives in `EditorShell` (via
  `useAiSidebarState`) and reaches the workspace page through
  `AiSidebarContext`. Why: the toggle is in the navbar
  (shared editor layout) while the sidebar is rendered by
  the workspace page; the layout can't pass props to the
  page. Same pattern as `ProjectDialogsContext`.
- "Desktop" for the AI sidebar's default is Tailwind `lg`
  (1024 px), not `md`. Why: between 768 and ~900 px an open
  sidebar would cover the right end of the bottom-center
  shape panel, so tablets start closed.
- `ShapeOutline` (`components/canvas/shape-outline.tsx`) is
  the only shape geometry. Anything that draws a shape
  (nodes, drag preview, later templates/thumbnails) uses
  it.
- Shape nodes have four `source` handles and the canvas
  uses `ConnectionMode.Loose`. Why: in React Flow's default
  strict mode a source handle only connects to a target
  handle, so each side would need two overlapping handles;
  loose mode lets any side connect to any side, which is how
  diagram editors behave. Edge creation still goes through
  `useLiveblocksFlow`'s `onConnect`.
- Shape list, drag payload and color keys live in `lib/`
  (`canvas-shapes.ts`, `canvas-colors.ts`), not in the
  canvas components, so templates and AI generation can use
  the same shape names, sizes and color keys later. Lucide
  icons stay in the panel (UI only).

- Liveblocks Storage declares `flow` as required and
  `RoomProvider` passes `initialStorage` (an empty
  `LiveObject` with empty `nodes` / `edges` `LiveMap`s),
  instead of an optional `flow` that `useLiveblocksFlow`
  would create on first load. Why: Liveblocks' types make
  `initialStorage` mandatory once Storage has a required
  key, and a required `flow` means later storage readers
  (AI generation, snapshots) never handle a missing canvas.
  `useLiveblocksFlow`'s `nodes.initial` option is therefore
  never used; seed content through storage mutations.
- React Flow styling: `@xyflow/react/dist/base.css` (the
  spec's "base styles"), not `style.css`, imported once in
  `components/canvas/canvas.tsx`. Theme colors are set by
  overriding `--xy-*` variables in `app/globals.css`, which
  keeps color values out of components and works
  regardless of stylesheet order (the library reads
  `var(--xy-x, var(--xy-x-default))`).

- Prisma 7 with a driver adapter (`@prisma/adapter-pg`), no
  Accelerate. Import the client and model types from
  `@/app/generated/prisma/client`; app code uses the
  `prisma` instance from `@/lib/prisma`.

- The editor's project lists are loaded by
  `app/editor/layout.tsx` as a promise created inside a
  `<Suspense>` boundary and resolved with `use()` in the
  sidebar, so `/editor` keeps a static shell. Mutations go
  through the route handlers, then `router.refresh()`
  re-runs the layout.

- The workspace navbar (project name, `Share`) and the
  sidebar highlight read the open project from the layout's
  project lists, matched by the `projectId` route param.
  Why: the navbar and sidebar live in the shared
  `app/editor/layout.tsx`, which can't receive data from
  the page, and those lists hold exactly the projects the
  user may open (same owner-or-collaborator rule). The page
  still does its own server-side access check; the navbar
  only displays. Rename/delete `router.refresh()` updates
  both.
- Server-side access checks go through
  `lib/project-access.ts`
  (`getCurrentIdentity` + `getProjectAccess`); its queries
  live in `lib/project-data.ts`.

- Project dialog state lives in `EditorShell` (via
  `useProjectDialogs`), not in each page, so the sidebar and
  any `/editor` page open the same dialogs. Pages reach it
  through `ProjectDialogsContext`, which exposes only the
  actions they need (`openCreateDialog`).

- Cache Components is on (`next.config.ts`), so session reads
  can't be in the static shell. `app/page.tsx` sets
  `export const instant = false` (it only redirects; there is
  no shell to show). The auth layout wraps the Clerk form in
  `<Suspense>` instead, so the branded panel prerenders and
  the form streams in (`◐` partial prerender).
- Clerk appearance fonts use `--font-geist-*`, not
  `--font-sans`: `@theme inline` does not emit `--font-sans`
  as a runtime CSS variable.

- Dark-only UI: no light palette exists, and `dark` is set
  statically on `<html>`. Why: the spec requires no default
  light styling, and shadcn components style dark mode via
  `dark:` variants that need the class present.
- Project sidebar is `absolute`, not `fixed`: it floats over
  whatever `relative` canvas container the editor page
  provides, so it sits below the navbar and the navbar
  toggle stays visible while it is open.
- Editor chrome components (`components/editor/*`) have no
  `'use client'` directive. Why: they take callback props,
  which can't cross the server/client boundary; per the
  Next.js docs, `'use client'` belongs only on entry points
  rendered directly by Server Components.
  `components/editor/editor-shell.tsx` is that entry point.
- Generated shadcn components import `cn` from the `cn`
  package directly; app code should import it from
  `@/lib/utils`.

## Session Notes

- App lives in `ghost-ai/` (Next.js 16.4, Tailwind v4 via
  `@tailwindcss/turbopack`, no PostCSS config).
- Repo layout (2026-10-10): `CONTEXT/` moved inside the repo
  (`ghost-ai/CONTEXT/`) so specs and context are versioned
  with the code. Agent instructions live in
  `ghost-ai/AGENTS.md` (Next.js block + context reading
  order); `ghost-ai/CLAUDE.md` imports it, and the workspace
  `CLAUDE.md` one level up points into `ghost-ai/`.
- The old blank templates and the methodology guide were
  moved to `_templates/` outside the repo (not project
  context, not committed).
- `.claude/settings.json` (committed) denies agent reads and
  edits of `.env*` files and shell commands that name them.
  It does not stop a recursive shell search that omits the
  filename (CodeRabbit PR #1); `AGENTS.md` tells agents not
  to run those. Full enforcement would need Claude Code's
  Bash sandbox (`sandbox.enabled`), not turned on because it
  changes how npm/git commands run.
- Work happens on the `development` branch; merge to `main`
  via pull request after CodeRabbit review.
- Dev server runs on port 3001 on this machine (3000 is used
  by another project). Use a real browser, not the VS Code
  preview, for Clerk sign-in.
