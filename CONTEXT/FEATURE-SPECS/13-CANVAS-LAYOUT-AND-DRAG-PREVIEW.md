Polish the workspace layout and the shape drag. Shape rendering and side handles already exist (feature 12) — do not rebuild them.

### Floating, Collapsible AI Sidebar

- the right AI chat placeholder floats over the canvas instead of taking width from it (absolute/fixed position, above the canvas in z-order), matching how the left project sidebar already floats
- the canvas always fills the full area under the navbar
- add a toggle button in the navbar's right section (before `Share`) to open/close the AI sidebar, using `PanelRightOpen` / `PanelRightClose` icons; open by default on desktop, closed on small screens
- when closed, the sidebar slides fully off-screen and is `inert` (not focusable)
- the shape panel and future canvas controls stay visible and are not covered by either sidebar when it is closed

### Shape Drag Preview

- while dragging a shape from the panel, the drag image is a preview of that shape (its outline at a reduced size), not the default browser ghost of the button
- build the preview from the same shape drawing code the node renderer uses, so they always match
- clean up any temporary DOM element used for the drag image after the drag starts

### Check when done

    - the canvas spans the full width; both sidebars float over it and fully hide when closed
    - the AI sidebar toggle works and is keyboard accessible with an `aria-label`
    - dragging each of the six shapes shows a preview of that shape
    - dropping still creates the node at the drop point and syncs (feature 12 behavior unchanged)
    - no TypeScript errors, no lint errors, `npm run build` passes
