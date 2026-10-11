Make the AI Architect chat shared and persistent: messages are stored in the project's Liveblocks room, so everyone in the project sees the same conversation in real time and it is still there after a reload. Replaces the local-only chat state from feature 20. The AI still does not reply here (feature 27 connects it).

Check the Liveblocks skill before writing code.

### Chat in Room Storage

- add an optional `aiChat` key to the room's Storage type: a `LiveList` of `LiveObject` messages with `id`, `role` (`user` | `assistant`), `content`, `authorId` (Clerk id, or `ghost-ai` for the AI), `authorName`, `createdAt` (ISO), optional `runId`
- rooms without the key: show the empty state; create the list on the first message
- keep at most the newest 200 messages (drop the oldest when adding past the cap)
- message content is capped (e.g. 4,000 characters) and trimmed

### Sidebar

- the AI Architect tab reads messages from `aiChat` instead of local state; new messages from anyone appear for everyone instantly
- user messages show the author's name (and "You" for your own); assistant messages show "Ghost AI"
- sending (Enter or the button) appends a user message to `aiChat`; for now, no placeholder assistant reply is added (remove the one from feature 20) — the empty-state note should say AI replies arrive in the next step
- starter chips, auto-scroll to newest, Enter/Shift+Enter, and the composer lock from feature 25 keep working
- remove `hooks/use-ai-chat.ts`'s local message state (keep the draft text local)

### Server Access

- add a small server-only helper (e.g. in `lib/`) that appends an assistant message to a room's `aiChat` through the Liveblocks Node client, for the design agent to use in feature 27

### Check when done

    - a message sent by one user appears for another user in the same project in real time
    - messages are still there after a page reload
    - the list never grows past 200 messages
    - a room with no chat yet shows the empty state without errors
    - no TypeScript errors, no lint errors, `npm run build` passes
