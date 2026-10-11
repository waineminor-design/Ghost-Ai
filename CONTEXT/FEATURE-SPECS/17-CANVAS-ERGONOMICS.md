Add a floating canvas control bar with zoom and undo/redo, wire keyboard shortcuts, and remove the minimap.

### Control Bar

- pill-shaped floating bar at the bottom-left of the canvas, not covered by the shape panel or either sidebar
- buttons: zoom out, zoom in, fit view, undo, redo
- every button has an `aria-label` (not just `title`) and a tooltip
- undo/redo are disabled when there is nothing to undo/redo
- undo/redo use Liveblocks' room history (so they cover synced canvas changes), not a local history
- tokens only

### Keyboard Shortcuts

- `+` or `=`: zoom in
- `-`: zoom out
- Ctrl+Z / Cmd+Z: undo
- Ctrl+Y / Cmd+Y and Ctrl+Shift+Z / Cmd+Shift+Z: redo
- shortcuts are ignored while typing in any input, textarea or contenteditable (label editing, dialogs, chat)

### Minimap

- remove the minimap

### Check when done

    - the control bar's zoom, fit view, undo and redo all work
    - keyboard shortcuts work, and do nothing while typing a label
    - undo/redo reverse and reapply node moves, adds, deletes, resizes, label and color changes
    - the minimap is gone
    - no TypeScript errors, no lint errors, `npm run build` passes
