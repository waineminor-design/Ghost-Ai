import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Only the Clerk auth routes are public; everything else requires a session.
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
