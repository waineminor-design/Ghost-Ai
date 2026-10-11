import { useState, useSyncExternalStore } from "react";

// Tailwind's `lg` breakpoint. The AI sidebar starts open from here up and
// closed below it. AiSidebar uses the matching `lg:` class for the first
// paint, so change both together.
const DESKTOP_QUERY = "(min-width: 64rem)";

export interface AiSidebarState {
  isOpen: boolean;
  // True until the user first toggles the sidebar. Until then it follows
  // the screen size: open on desktop, closed on small screens.
  followsScreenSize: boolean;
  toggle: () => void;
}

// Open state of the AI sidebar, owned by EditorShell.
export function useAiSidebarState(): AiSidebarState {
  const [userChoice, setUserChoice] = useState<boolean | null>(null);
  // The server can't know the screen size; it renders the desktop state.
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopQuery,
    matchesDesktopQuery,
    () => true,
  );
  const isOpen = userChoice ?? isDesktop;

  return {
    isOpen,
    followsScreenSize: userChoice === null,
    toggle: () => setUserChoice(!isOpen),
  };
}

function subscribeToDesktopQuery(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function matchesDesktopQuery() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}
