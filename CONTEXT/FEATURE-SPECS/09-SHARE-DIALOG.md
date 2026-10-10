Make the workspace `Share` button work: it opens a share dialog where the owner invites collaborators by email, sees and removes collaborators, and copies the project link.

### Who Can Do What

- owner: invite by email, view collaborators, remove collaborators, copy link
- collaborator: view the collaborator list and copy the link only — no invite or remove controls
- enforce these rules on the server; hiding buttons in the UI is not enough

### Share Dialog

Build on the existing `EditorDialog` pattern, tokens only.

- email input + `Invite` button (owner only); disabled while the email is invalid or a request is pending
- collaborator list: avatar, display name, email; a remove button per row (owner only)
- the owner is shown at the top of the list, labeled as owner
- `Copy link` button that copies the workspace URL and shows "Copied!" for about 2 seconds
    - if the clipboard write fails, show an error instead of "Copied!"
    - clear the timer when the dialog closes or the component unmounts
- request errors (e.g. already invited) appear inline in the dialog

### Collaborator Data

- collaborators are stored by email in `ProjectCollaborator` (existing schema — no schema changes)
- enrich each email with Clerk's backend API (display name + avatar image) on the server
- if no Clerk user exists for an email, show the email only with a generic avatar
- normalize emails: trim and lowercase before saving or comparing

### API Routes

Every route checks sign-in itself (`/api` is passed through by `proxy.ts`) and returns 401 JSON when signed out.

- `GET /api/projects/[projectId]/collaborators` — owner or collaborator; returns the owner and collaborators with enriched profile data
- `POST /api/projects/[projectId]/collaborators` — owner only; body `{ email }`
    - 400 for an invalid email
    - 400 when inviting the owner's own email
    - 409 when the email is already a collaborator
    - 201 with the new collaborator on success
- `DELETE /api/projects/[projectId]/collaborators/[collaboratorId]` — owner only; 204 on success
- non-owners get 403 for invite/remove; users with no access get 404; unknown project 404
- reuse `lib/project-access.ts` and `lib/api-response.ts`; keep queries in `lib/project-data.ts`

### State

- a dedicated hook (e.g. `hooks/use-project-share.ts`) owns the dialog's collaborator list, invite form, pending and error state, and copy-link state

### Check when done

    - owner can invite by email; the collaborator appears in the list
    - the invited user (signed in with that email) sees the project under `Shared` and can open the workspace
    - the invited user sees the list but no invite/remove controls, and the API rejects their invite/remove with 403
    - owner can remove a collaborator; that user then sees Access Denied
    - copy link shows "Copied!" and handles clipboard failure
    - no TypeScript errors, no lint errors, `npm run build` passes
