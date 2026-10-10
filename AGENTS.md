<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Application Building Context

Read the following files in order before implementing
or making any architectural decision (paths are relative
to this file's directory):

1. `CONTEXT/project-overview.md` — product definition,
   goals, features, and scope
2. `CONTEXT/architecture.md` — system structure,
   boundaries, storage model, and invariants
3. `CONTEXT/ui-context.md` — theme, colors, typography,
   and component conventions
4. `CONTEXT/code-standards.md` — implementation rules
   and conventions
5. `CONTEXT/ai-workflow-rules.md` — development workflow,
   scoping rules, and delivery approach
6. `CONTEXT/progress-tracker.md` — current phase,
   completed work, open questions, and next steps

Feature specs live in `CONTEXT/FEATURE-SPECS/`.

Update `CONTEXT/progress-tracker.md` after each
meaningful implementation change.

If implementation changes the architecture, scope, or
standards documented in the context files, update the
relevant file before continuing.

Never read, print, or commit `.env*` files — they hold
API keys and are git-ignored. This includes indirect
reads: do not run recursive searches or dumps over the
repo (e.g. `grep -r`, `findstr /s`, `cat *`) that would
include `.env*` files; use the Grep tool or `rg`, which
respect the deny rules and `.gitignore`. The deny rules in
`.claude/settings.json` block direct reads and edits but
cannot catch every shell command.
