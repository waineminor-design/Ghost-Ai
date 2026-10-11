Replace the "AI chat coming soon" placeholder in the floating AI sidebar (feature 13) with the real sidebar UI. UI only — no AI calls, no API routes, no persistence. Later features connect it to the backend.

### Layout

- keep the existing floating, collapsible sidebar and its navbar toggle
- header with two tabs (shadcn `Tabs`): `AI Architect` and `Specs`

### AI Architect Tab

- scrollable message area that fills the space between the tabs and the composer, auto-scrolling to the newest message
- empty state: a short intro ("Describe a system and I'll design it on the canvas") and 3–4 starter prompt chips (e.g. "Design a URL shortener", "Real-time chat app", "E-commerce checkout", "Video streaming platform"); clicking a chip fills the composer
- message bubbles: user messages right-aligned, assistant messages left-aligned with a small AI icon
- composer at the bottom: auto-growing textarea (max ~6 lines) and a send button
    - Enter sends, Shift+Enter adds a new line
    - send is disabled when the text is empty or whitespace
    - on send, append the user message and a placeholder assistant reply ("AI design generation is coming soon.") to local state, and clear the composer
- typing in the composer must not trigger canvas shortcuts

### Specs Tab

- a `Generate spec` button (no action yet beyond a disabled-looking "coming soon" state or toast)
- a placeholder spec card showing what a generated spec will look like: title, generated date, a few skeleton lines, and a disabled `Download` button

### Rules

- tokens only, existing shadcn components (`Tabs`, `Button`, `Textarea`, `ScrollArea`), Lucide icons
- component state lives in a small hook or the sidebar component; no global state
- accessible: tab list labels, button `aria-label`s where icon-only

### Check when done

    - the sidebar shows both tabs; switching works
    - starter chips fill the composer; Enter sends, Shift+Enter adds a line, empty sends are blocked
    - messages appear as bubbles and the list scrolls to the newest
    - the Specs tab shows the generate button and placeholder card
    - typing in the composer never zooms, undoes or deletes on the canvas
    - no TypeScript errors, no lint errors, `npm run build` passes
