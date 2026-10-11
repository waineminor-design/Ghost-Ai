Add a floating shape panel at the bottom of the canvas. Users drag a shape from it onto the canvas to create a node. After this unit, users can start building architecture diagrams.

Builds on feature 11. Use the shared types in `lib/canvas-types.ts`. Read the Liveblocks skill reference on multiplayer React Flow before writing code.

### Shapes

Six shapes, each with a name, an icon and a default size:
    - rectangle — general component / service
    - diamond — decision / gateway
    - circle — event / endpoint
    - pill — process / queue
    - cylinder — database / storage
    - hexagon — external system

Define the shape list once (name, label, default width/height) and reuse it for the panel and the node renderer.

### Shape Panel

- floating pill-shaped toolbar, centered at the bottom of the canvas, above the React Flow background
- one button per shape with its icon and an accessible label (`aria-label`, not just `title`)
- each button is draggable; on drag start, write the shape name and default size to `dataTransfer` under a custom MIME type (e.g. `application/ghost-shape`)
- tokens only — no hardcoded colors

### Drag and Drop (make this work end to end)

- the canvas container handles `onDragOver`: `preventDefault()` and set `dropEffect = "move"` — without this the browser never fires `drop`
- the canvas handles `onDrop`: `preventDefault()`, read the payload from `dataTransfer`, ignore drops that are not a shape
- convert the drop point from screen to canvas coordinates with React Flow's `screenToFlowPosition` (the canvas must be inside a `ReactFlowProvider` so `useReactFlow` works)
- create the node centered on the drop point, with:
    - id: `<shape>-<timestamp>-<counter>`
    - type: the custom shape node type
    - data: empty `label`, the dropped `shape`, and the default color key
    - the shape's default width and height
- add the node through the Liveblocks-synced flow (the same source `useLiveblocksFlow` reads from), never a separate local state, so it appears for everyone in the room

### Shape Node Renderer

- register one custom React Flow node type that draws the node in its shape (rectangle, diamond, circle, pill, cylinder, hexagon), e.g. with an SVG outline or CSS
- show the label centered (an empty label shows nothing yet — label editing comes later)
- node colors use a color key stored in `data.color` and mapped to design tokens in one place — no hex values in node data
- a visible selected state
- connection handles on the sides so later features can connect nodes

### Out of Scope

- label editing, resizing, color picking, edge styling, keyboard shortcuts, templates — later features

### Check when done

    - all six shapes appear in the bottom panel
    - dragging a shape onto the canvas creates a node exactly where it was dropped
    - the node renders in the right shape
    - with two users in the same project (owner and a collaborator), a shape dropped by one appears for the other in real time
    - nodes can be selected and dragged around, and the moves sync
    - no TypeScript errors, no lint errors, `npm run build` passes
