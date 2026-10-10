Clerk is already installed (`@clerk/nextjs`) and its API keys are in `.env.local`. Wire Clerk into the app: provider, sign-in/sign-up pages, redirects, route protection, and the user menu.

### Design

- use Clerk's dark theme from `@clerk/ui/themes` as the base
- override Clerk appearance variables with the app's existing CSS variables from globals.css — no hardcoded colors
- sign-in and sign-up pages:
    - large screens: two-panel 50/50 layout
        - left panel: logo, tagline, short feature list, on a surface color that sets it apart from the page background
        - right panel: centered Clerk form
    - small screens: form only
- no gradients, no oversized hero sections, no cards, no scroll-heavy layouts
- minimal and professional
- fonts must come from the tokens in `ui-context.md`

### Implementation

- wrap the root layout in `ClerkProvider` using the dark theme
- create sign-in and sign-up pages with Clerk's `<SignIn />` and `<SignUp />` components
- route protection goes in `proxy.ts` at the project root — NOT `middleware.ts` (this is Next.js 16)
- public routes: only the sign-in and sign-up routes, taken from the existing Clerk sign-in/sign-up URL env variables
- every other route is protected by default
- home page (`/`):
    - signed-in users are redirected to `/editor`
    - signed-out users are redirected to sign-in
- after sign-in and after sign-up, users land on `/editor`
- after sign-out, users land on sign-in — configure this through Clerk options/env variables, not as a prop on `UserButton`
- add Clerk's `UserButton` to the right section of the editor navbar for profile settings and sign-out
- keep Clerk's default user menu and profile flows — do not rebuild Clerk internals
- use the existing Clerk env variable names; add only the standard Clerk redirect variables if they are missing, do not invent new ones

### Dependencies

- `@clerk/ui` if needed for the dark theme

### Check when done

    - `proxy.ts` exists at the project root and no `middleware.ts` was created
    - all routes are protected except the public auth routes
    - signing in redirects to `/editor`; signing out works without errors
    - auth pages use CSS variables only — no hardcoded colors
    - `ClerkProvider` wraps the root layout
    - `npm run build` passes
