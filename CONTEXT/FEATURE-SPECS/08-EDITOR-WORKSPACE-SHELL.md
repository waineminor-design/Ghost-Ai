Build the project workspace page at `/editor/[projectId]` (it currently 404s after creating a project). Access-guarded, layout only — no canvas logic, no Liveblocks, no AI chat, no sharing behavior yet.

Read the Next.js 16 docs for dynamic route params (async) and `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md` before writing the page.

### Access Rules (server-side, before rendering)

- signed-out users are redirected to sign-in
- a signed-in user who is not the owner and not a collaborator sees the Access Denied screen
- a project id that does not exist also shows Access Denied (do not reveal whether it exists)

### Access Helpers

Create a small server-only module (e.g. `lib/project-access.ts`):
    - `getCurrentIdentity()` — the signed-in user's Clerk id and primary email (null when signed out)
    - `getProjectAccess(projectId, identity)` — returns the project plus the role (`owner` | `collaborator`) when the user may open it, or null otherwise. A collaborator is a `ProjectCollaborator` row whose email matches the user's primary email (case-insensitive).
- reuse the queries in `lib/project-data.ts` where possible — no duplicate query logic

### Access Denied Component

- centered layout, `Lock` icon, short message ("You don't have access to this workspace")
- a link back to `/editor`
- tokens only, no cards

### Workspace Layout

Reuse the existing editor shell (navbar + floating project sidebar) — do not build a second navbar or sidebar.

- full-viewport layout
- navbar center: the project name
- navbar right: workspace actions area (a `Share` button placeholder with no behavior yet, next to the existing `UserButton`)
- left: the existing project sidebar; the current project is highlighted
- sidebar project items now link to `/editor/<projectId>` so clicking a project opens its workspace
- center: canvas placeholder filling the remaining space — dark background with a centered message (e.g. "Canvas coming soon")
- right: a fixed-width sidebar placeholder for the future AI chat, with a subtle left border
- the editor home (`/editor`) stays as it is

### Check when done

    - signed out → redirected to sign-in
    - owner can open their project's workspace; project name shows in the navbar
    - another signed-in user without access sees Access Denied
    - a non-existent project id shows Access Denied
    - clicking a project in the sidebar opens its workspace, and it is highlighted
    - no canvas, Liveblocks, chat or sharing logic added
    - no TypeScript errors, no lint errors, `npm run build` passes
