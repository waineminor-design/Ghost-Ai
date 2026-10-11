Show who else is in the room: live cursors on the canvas and a stack of collaborator avatars in the workspace navbar. Uses the Presence (`cursor`) and UserMeta (`name`, `avatar`, `color`) types already declared in `liveblocks.config.ts` (feature 10).

### Live Cursors

- while the pointer moves over the canvas, update this user's `cursor` presence; set it to null when the pointer leaves the canvas
- store the cursor in canvas (flow) coordinates, not screen pixels: each user has their own pan/zoom, so convert with `screenToFlowPosition` when sending and `flowToScreenPosition` (or render inside the viewport) when drawing — a collaborator's cursor must point at the same spot on the diagram for everyone
- throttle presence updates (Liveblocks' built-in throttle is fine) so it stays smooth
- draw every other user's cursor (never your own): a small pointer arrow in their color with a name tag (their name on a pill in their color)
- cursors render above nodes but never block clicks (pointer-events none)
- cursors of users who leave disappear

### Avatar Stack

- in the workspace navbar's right section (before the AI sidebar toggle), a stack of overlapping round avatars for everyone in the room, including you
- each avatar shows the Clerk image (or initials on a colored circle when there's no image), ringed in the user's cursor color
- show at most 4 avatars, then a `+N` circle for the rest
- hovering an avatar shows a tooltip with the name; "(you)" after your own
- hidden on the editor home and outside a room

### Check when done

    - with two users in a project, each sees the other's cursor with their name, moving in real time
    - cursors point at the same diagram spot for both users even when their zoom/pan differ
    - the avatar stack shows both users, with names on hover
    - a user leaving removes their cursor and avatar
    - no TypeScript errors, no lint errors, `npm run build` passes
