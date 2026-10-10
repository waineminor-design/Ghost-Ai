# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Feature 04 complete; Feature 05: TBD

## Current Goal

- Awaiting next feature spec

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

## In Progress

- None.

## Next Up

- Feature 05 (TBD)

## Open Questions

- Project dialogs are UI only: create/rename/delete close
  after a simulated delay and do not change the mock list.
  Ownership uses `MOCK_CURRENT_USER_ID`, not the Clerk user
  id. Both are replaced when the project API lands.

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
  per-page/route `auth()` checks instead. Works today; decide
  whether to add resource-level checks (e.g. in API routes
  and the editor layout) when those features land.
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
