Add a starter template library so users can begin from a pre-built architecture diagram instead of a blank canvas.

### Templates

- define templates in one module (e.g. `lib/canvas-templates.ts`) using the shared node/edge types from `lib/canvas-types.ts`, the existing shape names, and the existing color keys
- at least four templates, each 6–12 nodes with labeled edges, laid out left-to-right so they read clearly:
    - Microservices (API gateway, services, databases, message queue)
    - CI/CD pipeline (repo, build, test, deploy stages, environments)
    - Event-driven system (producers, event bus, consumers, storage)
    - Three-tier web app (client, API, cache, database)
- each template has a name and a one-line description

### Templates Dialog

- a `Templates` button in the workspace navbar opens a dialog (built on the existing `EditorDialog` pattern)
- the dialog is wide (most of the viewport on desktop); cards are laid out in a grid with enough width that each preview shows the whole diagram
- each card shows a scaled SVG preview of the template's actual nodes and edges, its name, description and an `Import` button
- tokens only

### Importing

- importing replaces the current canvas content with the template, through the Liveblocks-synced flow, as one undoable change
- if the canvas is not empty, ask for confirmation before replacing it
- give imported nodes and edges fresh unique ids
- after import, fit the view to the new diagram
- the import appears for all collaborators in real time

### Check when done

    - the Templates button opens the dialog with wide, readable previews
    - importing a template places it on the canvas, fits the view, and syncs to a collaborator
    - importing over a non-empty canvas asks for confirmation; undo restores the previous canvas
    - no TypeScript errors, no lint errors, `npm run build` passes
