Add node resizing and inline label editing. All changes go through the Liveblocks-synced flow so collaborators see them in real time.

### Resizing

- show React Flow's `NodeResizer` only on the selected node
- drag a side to resize one dimension; drag a corner to resize both
- sensible minimum size (e.g. 60 × 40) so a node can't collapse
- the shape outline redraws to fill the new size
- size changes sync through the flow's `onNodesChange` (no separate local state)

### Inline Label Editing

- double-click a node to edit its label in place
- the editing text stays centered in the node exactly where the label normally sits — it must not jump to the top-left while typing (use a centered contenteditable element or an equivalently centered field)
- the label wraps inside the node and never overflows it visually
- Enter commits, Shift+Enter inserts a new line, Escape cancels and restores the previous label, clicking outside commits
- commit exactly once per edit: Enter/Escape followed by the resulting blur must not send a second update
- trim the label; an empty label is allowed (shows nothing)
- while editing, keyboard input must not trigger canvas shortcuts (e.g. Backspace must not delete the node)
- update the label through the flow so it syncs, using the shared node data type in `lib/canvas-types.ts`

### Check when done

    - a selected node shows resize handles; resizing works from sides and corners and syncs to a collaborator
    - double-click edits the label with the text centered while typing
    - Enter/click-outside saves, Escape cancels, Shift+Enter adds a line
    - Backspace while typing edits text instead of deleting the node
    - label changes sync to a collaborator in real time
    - no TypeScript errors, no lint errors, `npm run build` passes
