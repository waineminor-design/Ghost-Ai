Show everyone in a project when the AI is working: a shared status line in the AI sidebar, a "thinking" indicator on the Ghost AI cursor, and a disabled composer while a design run is active. No sending to the AI yet (feature 27 wires that).

Builds on feature 24 (the `design-agent` task already shows a Ghost AI presence with `isThinking`). Check the Liveblocks skill before writing code.

### Shared AI Status in Room Storage

- add an optional `aiStatus` key to the room's Storage type in `liveblocks.config.ts`: a `LiveObject` with `step` (`idle` | `started` | `thinking` | `applying` | `done` | `failed`), `message` (string), `runId` (string or null), `startedBy` (user name or null), `updatedAt` (ISO string)
- existing rooms don't have the key: readers treat a missing `aiStatus` as idle, and writers create it on first write
- the `design-agent` task writes its status steps to `aiStatus` (server-side, via the Liveblocks Node client's storage mutation) in addition to the run metadata it already records, and sets `done` or `failed` with a short message at the end
- the task's payload gets an optional `startedByName` so the status can say who started it (the API route from feature 23 passes the signed-in user's name)

### Status Line in the AI Sidebar

- at the top of the AI Architect tab, a slim status line visible to everyone in the room:
    - while `started` / `thinking` / `applying`: a spinner, the message, and "started by <name>"
    - `done` / `failed`: the message with a check or warning icon, shown for ~10 seconds after `updatedAt`, then hidden
    - `idle` or missing: hidden
- a status older than 3 minutes counts as idle (protects against a crashed worker leaving it stuck)

### Ghost AI Cursor

- when the Ghost AI user's presence has `isThinking: true`, its cursor name pill shows a small spinner before "Ghost AI"
- the Ghost AI avatar in the stack gets the same spinner ring while thinking

### Composer Lock

- while a run is active (status line spinner showing), the composer and send button are disabled for everyone in the room, with the placeholder "Ghost AI is working…"
- tokens only; accessible status line (`role="status"`)

### Check when done

    - starting a `design-agent` run from the Trigger.dev dashboard shows the status line with each step to every user in the project, then "done" briefly
    - the Ghost AI cursor and avatar show a spinner while thinking
    - the composer is disabled during the run and re-enabled after
    - a project whose room has never had a run works normally (no errors from the missing `aiStatus`)
    - no TypeScript errors, no lint errors, `npm run build` passes
