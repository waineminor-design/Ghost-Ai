Add a floating color toolbar for the selected node. Picking a color updates the node's fill, outline and text color instantly, synced to all collaborators.

### Palette

- 8 node colors, e.g. default (neutral), blue, green, purple, orange, red, yellow, teal
- each color defines a matching fill, outline and text color with readable contrast on the dark canvas
- define the colors as CSS custom properties in `app/globals.css` (reuse existing tokens where they fit) and map them in `lib/canvas-colors.ts` — the one place a color key becomes classes
- node data keeps storing only the color key (`data.color`), never hex values
- add the palette to the colors section of `CONTEXT/ui-context.md`

### Toolbar

- use React Flow's `NodeToolbar`, shown above the node only while it is selected (single selection)
- one round swatch per color; the current color is marked
- each swatch has an `aria-label` with the color name and is keyboard accessible
- choosing a color updates `data.color` through the Liveblocks-synced flow
- the toolbar must not appear while the label is being edited

### Check when done

    - selecting a node shows the color toolbar above it; deselecting hides it
    - picking a color changes the node's fill, outline and text immediately
    - the change appears for a collaborator in real time
    - node data contains only color keys
    - no TypeScript errors, no lint errors, `npm run build` passes
