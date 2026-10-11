# UI Context

## Theme

Dark only. No light mode. The design language is a dark,
precise, technical workspace — something that feels like an
engineering tool: near-black backgrounds, layered surfaces,
subtle borders, and restrained accent color reserved for
interactive and selected elements. Simple, functional,
modern.

## Colors

All colors are CSS custom properties defined in
`app/globals.css` (`:root`) and exposed to Tailwind through
`@theme inline`. Components must use these tokens through
Tailwind utility names — no hardcoded hex/oklch values and
no raw Tailwind palette classes.

| Role                 | CSS Variable           | Tailwind utility             |
| -------------------- | ---------------------- | ---------------------------- |
| Page background      | `--background`         | `bg-background`              |
| Primary text         | `--foreground`         | `text-foreground`            |
| Surface (cards)      | `--card`               | `bg-card`                    |
| Popovers / dialogs   | `--popover`            | `bg-popover`                 |
| Muted surface        | `--muted`              | `bg-muted`                   |
| Muted text           | `--muted-foreground`   | `text-muted-foreground`      |
| Primary action       | `--primary`            | `bg-primary`                 |
| Secondary action     | `--secondary`          | `bg-secondary`               |
| Hover / accent       | `--accent`             | `bg-accent`                  |
| Border               | `--border`             | `border-border`              |
| Input border         | `--input`              | `border-input`               |
| Focus ring           | `--ring`               | `ring-ring`                  |
| Error / destructive  | `--destructive`        | `text-destructive`           |
| Sidebar surface      | `--sidebar`            | `bg-sidebar`                 |
| Sidebar accent       | `--sidebar-primary`    | `bg-sidebar-primary`         |
| Canvas / chart hues  | `--chart-1` … `--chart-5` | `bg-chart-1` …            |

Current values are shadcn's neutral dark palette (see
`app/globals.css`). If the palette changes, change it in
`globals.css` and here — never in components. New tokens
(e.g. a fainter text tone, success state, node colors) are
added to `globals.css` first, then listed here.

### Node colors

Eight colors a canvas node can take, picked from the node
color toolbar. Each has a dark fill, a brighter outline and
light text, so labels stay readable on the dark canvas
(text on fill is above 10:1, outline on the canvas above
6:1). Tokens are in `:root` in `app/globals.css` and exposed
to Tailwind as `--color-node-*`. Nodes store only the key
(`data.color`); `NODE_COLORS` in `lib/canvas-colors.ts` is
the one place a key becomes classes.

| Key       | Fill               | Outline                    | Text                          |
| --------- | ------------------ | -------------------------- | ----------------------------- |
| `default` | `--card`           | `--input`                  | `--card-foreground`           |
| `blue`    | `--node-blue`      | `--node-blue-border`       | `--node-blue-foreground`      |
| `green`   | `--node-green`     | `--node-green-border`      | `--node-green-foreground`     |
| `purple`  | `--node-purple`    | `--node-purple-border`     | `--node-purple-foreground`    |
| `orange`  | `--node-orange`    | `--node-orange-border`     | `--node-orange-foreground`    |
| `red`     | `--node-red`       | `--node-red-border` (= `--destructive`) | `--node-red-foreground` |
| `yellow`  | `--node-yellow`    | `--node-yellow-border`     | `--node-yellow-foreground`    |
| `teal`    | `--node-teal`      | `--node-teal-border`       | `--node-teal-foreground`      |

Utilities: `fill-node-<key>`, `stroke-node-<key>-border`,
`text-node-<key>-foreground` (and `bg-` / `border-` for the
toolbar swatches). A new node color needs its three tokens
in `globals.css`, a row here and an entry in `NODE_COLORS`.

Exception: collaborator cursor colors are hex values in
`USER_COLORS` in `lib/liveblocks.ts`. They are sent to
other clients as Liveblocks user info, so they must be
concrete values, not CSS variables. Each user gets one via
`getUserColor(userId)`; never redefine the palette
elsewhere. Components receive a user's color as the
`--user-color` CSS variable (inline style) and use it
through `fill-(--user-color)`, `bg-(--user-color)` and
`ring-(--user-color)`.

## Typography

| Role      | Font       | Variable                          |
| --------- | ---------- | --------------------------------- |
| UI text   | Geist Sans | `--font-sans` (`--font-geist-sans`) |
| Headings  | Geist Sans | `--font-heading`                  |
| Code/mono | Geist Mono | `--font-mono` (`--font-geist-mono`) |

Font variables must point at the loaded font variables,
never at themselves.

## Border Radius

Base `--radius` is `0.625rem`; Tailwind radius utilities
are derived from it.

| Context           | Class        |
| ----------------- | ------------ |
| Inline / small UI | `rounded-md` |
| Cards / panels    | `rounded-lg` |
| Modals / overlays | `rounded-xl` |

## Component Library

shadcn/ui (base-nova style, Base UI primitives) on top of
Tailwind v4. Components live in `components/ui/`. Add new
ones with the shadcn CLI rather than writing them from
scratch, and do not edit the generated files. Build
app-specific wrappers in feature folders instead (e.g.
`components/editor/editor-dialog.tsx`).

## Layout Patterns

- Editor: full-viewport layout — top navbar, canvas filling
  the whole area under it, and two sidebars floating over
  the canvas: the project sidebar on the left and the AI
  chat/specs sidebar on the right (`w-80`, `rounded-xl`,
  `bg-sidebar`, `shadow-lg`). Neither takes width from the
  canvas; closed, each slides fully off-screen and is
  `inert`. The AI sidebar starts open from `lg` up and
  closed below. In a project workspace the navbar left
  section holds `Templates` (`LayoutTemplate`, ghost, icon
  only below `sm`) and the `Save` button after the project
  sidebar toggle, the
  center shows the project name and the right section holds
  the presence avatar stack, the AI sidebar toggle
  (`PanelRightOpen` / `PanelRightClose`) and `Share` (icon
  only below `sm`) before the `UserButton`. `Templates` and
  `Save` sit on the left because the right section is full
  on a 375 px phone.
- Canvas: React Flow (`colorMode="dark"`) fills the
  workspace, with a dot
  background and the canvas control bar (no minimap).
  React Flow's colors
  come from its `--xy-*` variables, mapped to the tokens in
  the `.react-flow` block of `app/globals.css`; change them
  there, not in components. While the room connects the
  canvas area shows a centered spinner and "Connecting to
  room…"; a failed connection shows a centered
  `TriangleAlert` (`text-destructive`) and a short message.
- AI sidebar: a header with shadcn `Tabs` (`AI Architect`
  with `Sparkles`, `Specs` with `FileText`, full-width list).
  AI Architect: at the top, a slim status line with the
  room's AI status, the same for everyone in the project
  (`role="status"`, `text-xs`, `border-b`; collapsed when
  there is nothing to show): while a run works a spinning
  `LoaderCircle`, the step's message and "· started by
  <name>" (muted); after it ends the result with a `Check`
  (done) or a `TriangleAlert` (`text-destructive`, failed)
  for ~10 s; nothing when idle, missing, or an unfinished
  status is over 3 minutes old. Below it, the project's
  shared messages (the same for everyone, live) in a
  `ScrollArea` that fills the
  space above the composer and scrolls to the newest; user
  bubbles right-aligned (`bg-primary`), assistant bubbles
  left-aligned (`bg-muted`) after a small round `Sparkles`
  icon (`bg-sidebar-accent`); bubbles `rounded-lg`, `text-sm`,
  at most 85% wide, each under a muted `text-xs` author
  line: the sender's name, "You" for your own, "Ghost AI"
  for assistant messages. While empty: a centered `Sparkles`
  circle, the intro "Describe a system and I'll design it on
  the canvas", a muted `text-xs` note that messages are
  shared with the project, and outline starter-prompt
  buttons that fill the composer. Sending a message starts
  a design run; Ghost AI's reply (the summary, or "I
  couldn't finish that design. Please try again.") arrives
  as an assistant message for everyone. If the run can't
  start, a `text-xs text-destructive` note "Couldn't start
  the design — try again" (`role="alert"`) appears under
  the message, only for its sender. Composer pinned at the bottom
  (`border-t`): a one-line `Textarea` that grows to six
  lines and then scrolls (stops at 2,000 characters, the
  longest design prompt), and
  an icon-only send button (`ArrowUp`, disabled while the
  text is blank or the room hasn't connected). While a
  run is active (status line spinner showing) both are
  disabled for everyone in the room, with the placeholder
  "Ghost AI is working…"; a draft already typed stays. For
  the person who sent the prompt they are disabled from
  the moment they send until their run ends. After a
  successful run, their canvas fits the view to the whole
  diagram (only their view moves). Enter
  sends, Shift+Enter adds a line. Specs: a short line of
  copy, a full-width `Generate spec` button (disabled, with
  "Spec generation is coming soon."), and an example spec
  card (`rounded-lg`, `bg-card`): `FileText` + title,
  "Generated" with a muted bar for the date, muted skeleton
  lines and a disabled outline `Download` button.
- Canvas control bar: the same pill as the shape panel
  (`rounded-full`, `bg-card`, `border-border`, `shadow-lg`)
  at the bottom-left of the canvas: zoom out, zoom in, fit
  view, a thin divider, undo, redo (round icon buttons,
  muted icon, `bg-accent` on hover). Each button has an
  `aria-label` and a tooltip (shadcn `Tooltip`) naming it
  and its shortcut. Undo/redo are dimmed (`opacity-50`)
  when there is nothing to undo/redo but stay focusable, so
  their tooltip still shows. Where the canvas is too narrow
  for the bar and the shape panel side by side (below `md`)
  the bar sits above the shape panel; while the project
  sidebar is open (from `md`) it slides right of the
  sidebar. Shortcuts: `+`/`=` zoom in, `-` zoom out,
  Ctrl/Cmd+Z undo, Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z redo, all
  ignored while typing in a text field.
- Shape panel: a pill-shaped toolbar (`rounded-full`,
  `bg-card`, `border-border`) centered at the bottom of the
  canvas, one round icon button per shape (muted icon,
  `bg-accent` on hover). Buttons are dragged onto the
  canvas (or clicked to add at the view center). While
  dragging, the drag image is the shape's outline at 60%
  size (node fill, `stroke-primary`), drawn by the same
  `ShapeOutline` as the nodes.
- Shape nodes: SVG outline in the node's shape, filled and
  stroked from the node's color key (see Node colors above);
  selected nodes keep their color's outline at a thicker
  width (the resize frame marks the selection), so a newly
  picked color shows at once. Label centered. Connection
  handles on all four sides (`--xy-handle-background-color`
  = `--muted-foreground`), shown on hover or when selected.
  Selected nodes show React Flow's resizer (side lines and
  corner handles, `--xy-resize-background-color` =
  `--primary`), minimum 60×40. Double-click edits the label
  in place: the editor uses the label's own centered,
  wrapping layout, so the text does not move while typing.
- Edges: any handle connects to any other handle on a
  different node (no self-connections); the edge leaves and
  enters through the handles used. Bezier curve with a
  closed arrowhead at the target and a 24px invisible hit
  area. Default stroke `--muted-foreground` at 1.5px;
  selected `--primary` at 2.5px, arrowhead included. Colors
  come from `--xy-edge-stroke` / `--xy-edge-stroke-selected`
  in the `.react-flow` block of `app/globals.css`.
  Double-click an edge (or its label) to edit the label in
  place at the midpoint: a small box (`rounded-md`,
  `bg-card`, `border-border`, `text-xs`, `shadow-sm`); no
  box when the label is empty. Enter or clicking outside
  saves, Shift+Enter adds a line, Escape cancels. Delete or
  Backspace removes the selected nodes and edges (not while
  typing in a label).
- Node color toolbar: React Flow `NodeToolbar` above the
  node, shown only while it is the single selected node and
  hidden while its label is edited. Same pill as the shape
  panel (`rounded-full`, `bg-card`, `border-border`,
  `shadow-lg`), one round swatch per node color (fill with
  its outline as the border, `bg-accent` behind it on
  hover); the current color shows a `Check` in its text
  color and has `aria-pressed`. Each swatch's `aria-label`
  is the color name.
- Access denied: centered `Lock` icon, short message and a
  link back to `/editor`; no card.
- Navbar: fixed-height (`h-12`) top bar with left, center
  and right sections and a subtle bottom border.
- Save button: ghost, `sm`, icon only below `sm`; the label
  and icon show the canvas autosave status: `Save` (`Save`
  icon, idle / up to date), `Saving…` (spinning
  `LoaderCircle`), `Saved` (`Check`, about 2 s, then back to
  `Save`) and `Save failed` (`TriangleAlert`,
  `text-destructive`; clicking retries). Disabled only while
  a saved canvas is being restored into an empty room. Only
  in a connected room; never on the editor home. A hidden
  status region announces failures only.
- Presence avatar stack: everyone in the room, you first,
  one avatar per user, as overlapping (`-ml-2`) `size-8`
  shadcn `Avatar`s — Clerk image, or initials on a circle
  in the user's cursor color (`text-background`) — each
  ringed in that color (`ring-2`, `ring-offset-2` in
  `--background`, which also separates the overlap).
  Tooltip below with the name, "(you)" on your own.
  While Ghost AI is thinking, its ring is replaced by a
  spinning arc in its color in the same place
  (`border-2`, top side transparent, `animate-spin`). At most
  4 avatars then a muted `+N` circle from `lg`, 2 then `+N`
  between `md` and `lg`, hidden below `md` (no room on
  phones). Only in a connected room; never on the editor
  home.
- Collaborator cursors: every other user's pointer on the
  canvas, at the same diagram point for everyone whatever
  their pan/zoom. A 12×16 pointer arrow filled in the
  user's cursor color with a `--foreground` outline, and
  the name on a `rounded-full` pill in that color
  (`text-xs`, `font-medium`, `text-background`,
  `shadow-sm`) below-right of the tip. While Ghost AI is
  thinking, its pill shows a small spinning `LoaderCircle`
  (`size-3`) before "Ghost AI". Above the nodes and
  panels, `pointer-events: none`. Your own cursor is not
  drawn.
- Project sidebar: floats above the canvas and slides in
  from the left; it does not push page content. On mobile,
  tapping outside closes it (backdrop scrim).
- Modals: centered overlay dialogs built on the shared
  `EditorDialog` pattern (title, description, footer
  actions). Request errors show inline in the dialog
  (`RequestError`, `text-destructive`).
- Share dialog: owner-only email + `Invite` row, a
  "People with access" list (avatar, name, email; owner
  first with an `Owner` badge; remove buttons for the owner
  only), and `Copy link` in the footer ("Copied!" for ~2 s).
  Users without a Clerk profile show the email next to a
  generic `UserRound` avatar (shadcn `Avatar`).
- Templates dialog: `EditorDialog` widened to
  `min(80rem, 100% - 4rem)` from `sm`, at most the screen
  height, the card list scrolling inside it. Cards
  (`rounded-lg`, `bg-card`, `border-border`) in one column,
  two from `lg`: a `5:2` preview (`bg-background`) on top,
  then name, one-line description and an `Import` button.
  The preview is an SVG of the template's real nodes and
  edges, drawn with `ShapeOutline`, the node color classes
  and React Flow's bezier path, with non-scaling strokes and
  no labels (too small to read at that scale). Importing
  over a non-empty canvas opens a nested "Replace the
  canvas?" dialog (Cancel + destructive `Replace canvas`).
- Auth pages: 50/50 split — a branded colored panel on one
  side, the Clerk form on the other.

## Icons

Lucide React. Stroke-based icons only. Sizes: `h-4 w-4`
inline, `h-5 w-5` in buttons.
