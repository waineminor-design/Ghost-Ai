import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// The Clerk auth routes are public; pages require a session. API routes
// are passed through so their handlers can answer 401 JSON themselves
// (`auth.protect()` would redirect or 404); the middleware still runs on
// them so `auth()` works in the handlers.
// Fallbacks keep the auth pages public even if the env vars are missing,
// which would otherwise put sign-in behind sign-in (a redirect loop).
// The matcher needs pathnames, so absolute URLs are reduced to their path.
const toPathname = (url: string) => new URL(url, "http://localhost").pathname;

const signInUrl = toPathname(
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in",
);
const signUpUrl = toPathname(
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up",
);

const isPublicRoute = createRouteMatcher([
  `${signInUrl}(.*)`,
  `${signUpUrl}(.*)`,
  "/api",
  "/api/(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
