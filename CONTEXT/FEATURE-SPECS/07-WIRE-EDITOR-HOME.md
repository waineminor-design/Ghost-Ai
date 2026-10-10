Wire the editor home, sidebar and project dialogs to the real project APIs from feature 06. After this unit the sidebar shows real projects from the database instead of mock data.

### Data Fetching

- fetch the signed-in user's owned and shared projects on the server, using the data module from feature 06 (no client-side fetching for the initial load)
- pass both lists into the editor shell / sidebar as props
- Cache Components is enabled — follow `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md` for reading the session and per-user data (Suspense boundary or `instant = false`, as the docs recommend)
- the owner check for sidebar actions uses the real Clerk user id
- remove `lib/mock-projects.ts` and every use of mock data

### Project Actions

Extend the existing `hooks/use-project-dialogs.ts` (do not create a second dialog hook) so it calls the APIs:

Create:
    - `POST /api/projects` with the name
    - on success, navigate to `/editor/<projectId>`
    - the create dialog's preview shows the room id format: `<slug>-xxxxxx` (the suffix is assigned by the server)

Rename:
    - `PATCH /api/projects/<projectId>` with the new name
    - refresh the project list on success

Delete:
    - `DELETE /api/projects/<projectId>`
    - refresh the project list on success; if the user is currently viewing that project, redirect to `/editor`

All actions:
    - keep the existing loading states and validation
    - show an error message in the dialog if the request fails (do not close the dialog)

### Notes

- `/editor/<projectId>` has no page yet — the workspace page comes in a later feature, so a not-found page after create is expected
- do not change the API routes in this unit

### Check when done

    - sidebar shows real projects from the database (owned in My Projects, shared in Shared)
    - creating a project saves it and navigates to `/editor/<projectId>`; it appears in the sidebar
    - rename updates the name in the sidebar
    - delete removes it from the sidebar
    - `lib/mock-projects.ts` is gone
    - no TypeScript errors, no lint errors, `npm run build` passes
