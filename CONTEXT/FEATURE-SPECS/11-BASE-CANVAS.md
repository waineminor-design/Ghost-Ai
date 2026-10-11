Replace the workspace's "Canvas coming soon" placeholder with a real React Flow canvas backed by Liveblocks, so everyone with access to a project connects to the same room and shares the same canvas state (nodes and edges sync in real time). Canvas foundation only — no shape panel, custom nodes, custom edges or toolbar controls yet.

Uses the infrastructure from feature 10. Read the installed `@liveblocks/react-flow` and `@xyflow/react` docs (or the Liveblocks skill) for the current API before writing code.

### Canvas Types — `lib/canvas-types.ts`

- shared TypeScript types for canvas nodes and edges, used everywhere the canvas schema appears (later: templates, AI generation, spec generation)
- node data: `label` (string), `shape` (string), `color` (string)
- keep it minimal; later features extend it

### Storage

- fill in the `Storage` type in `liveblocks.config.ts` with whatever `@liveblocks/react-flow` requires to sync nodes and edges

### Room

- a client canvas component that wraps the canvas in `LiveblocksProvider` (auth endpoint `/api/liveblocks-auth`) and `RoomProvider` with the project id as the room id
- initial presence: `cursor: null`, `isThinking: false`
- while connecting, show a centered "Connecting to room…" state
- if authentication or connection fails, show a centered error message instead of a blank canvas

### Canvas

- React Flow canvas filling the workspace's canvas area (the AI chat placeholder on the right stays)
- nodes and edges come from Liveblocks storage, not local state, so changes sync to everyone in the room
- dark color mode; background dots and a minimap, styled to fit the dark theme tokens
- import React Flow's base styles once
- users can pan and zoom

### Check when done

    - opening a project shows "Connecting to room…", then the canvas
    - two users with access (owner and collaborator) can open the same project at the same time without errors
    - a user without access still sees Access Denied (page guard from feature 08) and cannot get a room token
    - no shape panel, custom nodes or edges added
    - no TypeScript errors, no lint errors, `npm run build` passes
