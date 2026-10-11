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
  the rest, a floating left project sidebar, and a right
  chat/specs sidebar (fixed width, `border-l`, hidden below
  `md`). In a project workspace the navbar center shows the
  project name and the right section holds workspace
  actions (`Share`) before the `UserButton`.
- Access denied: centered `Lock` icon, short message and a
  link back to `/editor`; no card.
- Navbar: fixed-height (`h-12`) top bar with left, center
  and right sections and a subtle bottom border.
- Project sidebar: floats above the canvas and slides in
  from the left; it does not push page content. On mobile,
  tapping outside closes it (backdrop scrim).
- Modals: centered overlay dialogs built on the shared
  `EditorDialog` pattern (title, description, footer
  actions).
- Auth pages: 50/50 split — a branded colored panel on one
  side, the Clerk form on the other.

## Icons

Lucide React. Stroke-based icons only. Sizes: `h-4 w-4`
inline, `h-5 w-5` in buttons.
