Build the editor home screen and the project dialogs (create, rename, delete) plus the sidebar project actions. UI only — no API calls yet. Use mock project data.

### Editor Home

- reuse the existing editor layout — do not change navbar or sidebar behavior
- centered content on the empty canvas area:
    - heading: "Create a project or open an existing one"
    - description: "Start a new architecture workspace or choose a project from the sidebar."
    - `New Project` button with `Plus` icon
- minimal layout — do not wrap this content in cards
- clicking `New Project` opens the create dialog

### Dialogs

Build all three on the existing `EditorDialog` pattern, using color tokens from globals.css only.

Create project:
    - project name input
    - live slug preview generated from the name, updating as the user types
    - create button shows a loading state

Rename project:
    - project name input prefilled with the current name
    - live slug preview, same as create

Delete project:
    - show the name of the project being deleted
    - clear confirmation message that this cannot be undone
    - cancel button and a destructive delete button

Validation (create and rename):
    - disable submit when the name is empty or whitespace
    - disable submit when the generated slug would be empty (e.g. a name made only of special characters)

### Sidebar Project Actions

- each project item in `My Projects` gets `Rename` and `Delete` actions
- show actions only for projects the user owns — hide them for shared/collaborator projects
- on mobile, tapping outside the open sidebar closes it, with a backdrop scrim behind it

### Implementation

- create a dedicated hook in `hooks/` (e.g. `hooks/use-project-dialogs.ts`) that owns dialog state, form state (name, slug) and loading state
- strictly typed — a `Project` interface, no `any`
- wire:
    - editor home `New Project` → create dialog
    - sidebar `New Project` → create dialog
    - sidebar `Rename` → rename dialog
    - sidebar `Delete` → delete dialog
- mock project data only (a few owned projects and at least one shared project) — no API calls, no database

### Check when done

    - all sidebar actions open the correct dialog
    - slug preview updates as you type, and empty slugs are rejected
    - actions are hidden on shared projects
    - delete dialog names the project and has a cancel button
    - no TypeScript errors, no lint errors, `npm run build` passes
    - `progress-tracker.md` shows Feature 04 as complete and Feature 05 as next (not both in progress and complete)
