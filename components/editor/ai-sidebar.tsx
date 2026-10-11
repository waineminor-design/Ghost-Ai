"use client";

import { useAiSidebarVisibility } from "@/components/editor/ai-sidebar-context";
import { cn } from "@/lib/utils";

// AI chat placeholder. Floats over the right edge of the canvas, like the
// project sidebar on the left, and slides off-screen when closed. Opened
// and closed from the navbar. The parent container must be `relative`.
export function AiSidebar() {
  const { isOpen, followsScreenSize } = useAiSidebarVisibility();

  return (
    <aside
      aria-label="AI chat"
      inert={!isOpen}
      className={cn(
        "absolute inset-y-2 right-2 z-20 flex w-80 max-w-[calc(100%-1rem)] flex-col items-center justify-center rounded-xl border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-lg transition-transform duration-200 ease-out",
        // Until the user toggles it, CSS picks the state by screen size so
        // the first paint is right before the client knows the width.
        followsScreenSize
          ? "translate-x-[calc(100%+0.5rem)] lg:translate-x-0"
          : isOpen
            ? "translate-x-0"
            : "translate-x-[calc(100%+0.5rem)]",
      )}
    >
      <p className="text-sm text-muted-foreground">AI chat coming soon</p>
    </aside>
  );
}
