Replace the default canvas edges with a custom edge that is easier to follow, easier to click, and supports inline labels. Connection handles on all four node sides already exist (feature 12).

### Connecting

- users can connect from any handle to any other handle (top, right, bottom, left), and the edge leaves/enters from the handles actually used
- new connections use the custom edge type by default
- no self-connections (a node to itself)

### Custom Edge

- smooth path (bezier or smooth-step) with an arrowhead at the target
- a wide invisible hit area along the path so the edge is easy to click
- subtle default color; a clearly visible selected state (tokens only)
- add the edge data type (`label`) to `lib/canvas-types.ts`

### Inline Edge Labels

- double-click an edge to add or edit its label, shown at the edge's midpoint
- Enter or clicking outside commits, Escape cancels
- commit exactly once per edit: Enter/Escape followed by the resulting blur must not send a second update
- an empty label hides the label box
- label changes go through the Liveblocks-synced flow
- while editing, keyboard input must not trigger canvas shortcuts

### Deleting

- selected nodes and edges can be deleted with Delete or Backspace (not while editing text)
- deleting a node also removes its connected edges
- deletions sync to collaborators

### Check when done

    - edges connect between any two sides and follow the used handles
    - edges are easy to click; selection is clearly visible
    - double-click adds/edits an edge label that saves once and syncs
    - Delete/Backspace removes selected nodes and edges, and syncs
    - no TypeScript errors, no lint errors, `npm run build` passes
