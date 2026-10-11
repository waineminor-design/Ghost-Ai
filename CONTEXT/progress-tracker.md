# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Feature 09 (Share Dialog) complete; browser check with two
  Clerk accounts pending

## Current Goal

- Owner browser-checks feature 09, then the next spec

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

## In Progress

- None.

## Next Up

- Browser check of feature 09 (two Clerk accounts), then
  feature 10 (no spec yet)

## Open Questions

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
