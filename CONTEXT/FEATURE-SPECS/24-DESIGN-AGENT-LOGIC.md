Implement the AI design agent inside the `design-agent` Trigger.dev task: it reads the current canvas, asks Gemini what to change based on the user's prompt, and applies those changes to the project's Liveblocks room so everyone sees the diagram appear. No UI changes in this unit (the sidebar is wired later).

Check the Liveblocks and Trigger.dev agent skills and the installed Vercel AI SDK docs before writing code. The Gemini key is in `.env.local` as `GOOGLE_GENERATIVE_AI_API_KEY` (the AI SDK's default name). Do not read, print or edit any `.env*` file.

### Packages

- `ai` (Vercel AI SDK) and `@ai-sdk/google`

### Model

- use a current Gemini model available in the installed `@ai-sdk/google` (check its docs — older ones like `gemini-2.0-flash` have been retired), defined once as a constant so it is easy to change

### Reading the Canvas

- load the room's current nodes and edges server-side with the Liveblocks Node client (`lib/liveblocks.ts`)
- pass the AI a compact description: node ids, labels, shapes, colors, positions/sizes, and edges with labels

### Generating Actions — use tool calling

- do NOT rely on one big structured-output object (it fails schema validation with Gemini); instead use `generateText` with a `tools` object where each canvas action is its own tool with a zod input schema:
    - `addNode` (a short `key` the model picks, e.g. `api-gateway`; shape from the existing shape list, label, color key from the existing palette, position, optional size)
    - `updateNode` (label and/or color), `moveNode`, `resizeNode`, `deleteNode`
    - `addEdge` (source, target, optional label, optional handles), `updateEdge` (label), `deleteEdge`
- references: `source`/`target` and the node-editing tools accept either an existing node id from the canvas description or a `key` from an `addNode` call in the same response, so the model can connect nodes it is creating in this run
- when applying, give each new node a unique canvas id and resolve every key to that id; a key used twice in one response, or a reference to an unknown id/key, makes that action invalid
- collect the tool calls, validate them (known ids/keys, known shapes and colors, sizes ≥ the canvas minimum), and ignore invalid ones
- a system prompt explains Ghost AI's purpose, the available shapes and what they usually mean, the color keys, and to lay diagrams out left-to-right with clear spacing and labeled edges
- generated node/edge ids are unique (same id style as the canvas)

### Applying Changes

- apply all valid actions to room storage in a single Liveblocks storage mutation, in exactly the format the client's `@liveblocks/react-flow` storage uses (check the skill/docs; nodes and edges must render and sync like ones created in the browser)
- new nodes use the shared shape node type and new edges the labeled edge type

### Status and Presence

- while running, set an AI presence in the room (an AI identity with `isThinking: true`, and a cursor near where it is working if practical) and clear it when done or failed
- record short status messages at key steps (started, thinking, applying N changes, done, failed) in a form the UI can subscribe to later — keep it simple and document the format in `architecture.md`
- the task returns `{ actionsApplied, summary }`

### Environment

- the local Trigger.dev worker needs `GOOGLE_GENERATIVE_AI_API_KEY`, `LIVEBLOCKS_SECRET_KEY` and `DATABASE_URL` — confirm `npm run trigger:dev` loads them from `.env.local` (feature 22)

### Check when done

    - a test run of `design-agent` from the Trigger.dev dashboard (with a real project id and a prompt like "Design a real-time chat app with a websocket server, presence service, Redis pub/sub, a Postgres database and S3 for media") succeeds and the diagram appears live on that project's canvas in the browser
    - invalid AI actions are skipped, not fatal
    - AI presence appears during the run and clears after
    - no TypeScript errors, no lint errors, `npm run build` passes
