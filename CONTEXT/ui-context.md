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

Exception: collaborator cursor colors are hex values in
`USER_COLORS` in `lib/liveblocks.ts`. They are sent to
other clients as Liveblocks user info, so they must be
concrete values, not CSS variables. Each user gets one via
`getUserColor(userId)`; never redefine the palette
elsewhere.

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
  closed below. In a project workspace the navbar center
  shows the project name and the right section holds the
  AI sidebar toggle (`PanelRightOpen` / `PanelRightClose`)
  and `Share` (icon only below `sm`) before the
  `UserButton`.
- Canvas: React Flow (`colorMode="dark"`) fills the
  workspace, with a dot
  background and a bottom-right minimap
  (`rounded-lg border border-border`). React Flow's colors
  come from its `--xy-*` variables, mapped to the tokens in
  the `.react-flow` block of `app/globals.css`; change them
  there, not in components. While the room connects the
  canvas area shows a centered spinner and "Connecting to
  room…"; a failed connection shows a centered
  `TriangleAlert` (`text-destructive`) and a short message.
  The minimap is hidden below `sm` so it doesn't cover the
  shape panel on phones.
- Shape panel: a pill-shaped toolbar (`rounded-full`,
  `bg-card`, `border-border`) centered at the bottom of the
  canvas, one round icon button per shape (muted icon,
  `bg-accent` on hover). Buttons are dragged onto the
  canvas (or clicked to add at the view center). While
  dragging, the drag image is the shape's outline at 60%
  size (node fill, `stroke-primary`), drawn by the same
  `ShapeOutline` as the nodes.
- Shape nodes: SVG outline in the node's shape, filled and
  stroked from the node's color key (`lib/canvas-colors.ts`;
  `default` = `fill-card`, `stroke-input`,
  `text-card-foreground`); selected nodes get a thicker
  `stroke-primary` outline. Label centered. Connection
  handles on all four sides (`--xy-handle-background-color`
  = `--muted-foreground`), shown on hover or when selected.
  New node colors are added to `NODE_COLORS` only.
  Selected nodes show React Flow's resizer (side lines and
  corner handles, `--xy-resize-background-color` =
  `--primary`), minimum 60×40. Double-click edits the label
  in place: the editor uses the label's own centered,
  wrapping layout, so the text does not move while typing.
- Access denied: centered `Lock` icon, short message and a
  link back to `/editor`; no card.
- Navbar: fixed-height (`h-12`) top bar with left, center
  and right sections and a subtle bottom border.
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
- Auth pages: 50/50 split — a branded colored panel on one
  side, the Clerk form on the other.

## Icons

Lucide React. Stroke-based icons only. Sizes: `h-4 w-4`
inline, `h-5 w-5` in buttons.
