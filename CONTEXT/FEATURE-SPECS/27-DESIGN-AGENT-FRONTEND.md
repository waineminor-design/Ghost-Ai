Connect the AI Architect chat to the design agent: sending a message starts a design run, everyone sees its progress, and the AI's summary arrives as a chat reply while the diagram appears on the canvas. Builds on features 23 (API routes), 24 (agent), 25 (status) and 26 (shared chat).

Check the Trigger.dev realtime skill and the Liveblocks skill before writing code.

### Sending

- when a user sends a message in the AI Architect tab:
    1. append the user message to `aiChat` (feature 26)
    2. `POST /api/ai/design` with `{ projectId, prompt }`
    3. on `202`, keep the returned `runId` in local state
    4. on an error response, append a local-only error note under the message ("Couldn't start the design — try again") and re-enable the composer
- the composer stays locked while the room's `aiStatus` shows an active run (feature 25), so two runs can't start at once from the UI

### Following the Run (the user who started it)

- install `@trigger.dev/react-hooks`
- request a token from `POST /api/ai/runs/[runId]/token`
- only mount the component that calls `useRealtimeRun` once both a run id and a non-empty token exist — never call it with an empty or missing token (that throws "missing access token" on render)
- use the run's state to detect completion or failure quickly; when the run ends, clear the local run id and token

### The AI's Reply

- the `design-agent` task appends the assistant message to `aiChat` itself when it finishes (using the helper from feature 26), so the reply is saved even if the person who started it has left:
    - success: the summary of what it changed
    - failure: a short, friendly message ("I couldn't finish that design. Please try again.") — never raw error details
- include the `runId` on the assistant message

### Canvas

- the diagram changes arrive through Liveblocks automatically (feature 24) — no extra canvas code
- after a successful run, the starter's canvas fits the view to show the whole diagram

### Check when done

    - typing a prompt in the AI Architect tab and pressing Enter starts a run; the status line shows progress to everyone; the diagram appears on the canvas; the AI's summary appears as a chat reply for everyone
    - opening a project never shows a "missing access token" error, with or without an active run
    - a failed run shows the friendly failure reply and re-enables the composer
    - an error from the start route shows the error note and re-enables the composer
    - no TypeScript errors, no lint errors, `npm run build` passes
