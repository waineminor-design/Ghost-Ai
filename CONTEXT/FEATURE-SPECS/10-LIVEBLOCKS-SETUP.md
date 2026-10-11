Set up the real-time collaboration infrastructure with Liveblocks: packages, the shared config/types, a server-side Liveblocks client, and the room auth endpoint. Infrastructure only — no UI changes, no canvas yet.

The Liveblocks keys are already in `.env.local` as `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` and `LIVEBLOCKS_SECRET_KEY`. Do not read, print or edit any `.env*` file. If the Liveblocks agent skill is installed, use it; read the installed packages' docs for current APIs.

### Packages

- `@liveblocks/client`, `@liveblocks/react`, `@liveblocks/react-ui`, `@liveblocks/react-flow`, `@liveblocks/node`, `@xyflow/react`

### Config and Types — `liveblocks.config.ts` (project root)

Declare the global Liveblocks types:
    - Presence: `cursor` (`{ x: number; y: number } | null`) and `isThinking` (boolean, for the future AI agent)
    - UserMeta: `id` (Clerk user id) and `info` (`name`, `avatar` URL or null, `color`)
    - Storage: leave as an empty placeholder — feature 11 fills it in

### Server Client — `lib/liveblocks.ts`

- server-only module exporting one cached Liveblocks Node client created from `LIVEBLOCKS_SECRET_KEY`
- a `getUserColor(userId)` helper that deterministically picks a cursor color from a small fixed palette defined in this one place (the same user always gets the same color)

### Room Auth Endpoint — `POST /api/liveblocks-auth`

- the room id is the project id (they are the same value by design)
- signed out → 401 JSON
- read the requested room from the body; missing or invalid → 400
- check access with `getCurrentIdentity()` + `getProjectAccess()` from `lib/project-access.ts`; no access or unknown project → 403
- on success: prepare a Liveblocks session for the Clerk user id with user info (name from Clerk, avatar, color from `getUserColor`), grant full access to that one room only, and return Liveblocks' authorize response (body and status) unchanged
- never grant wildcard access to other rooms
- `/api` is passed through by `proxy.ts`, so this handler does its own auth check

### Check when done

    - packages installed
    - `liveblocks.config.ts` declares Presence and UserMeta (Storage placeholder)
    - `lib/liveblocks.ts` exports a single cached client and `getUserColor`
    - `POST /api/liveblocks-auth` returns 401 signed out, 400 for a bad body, 403 without project access, and grants access only to the requested room
    - no UI files changed, no `.env*` file touched
    - no TypeScript errors, no lint errors, `npm run build` passes
