import { createContext, use } from "react";

import type { AiSidebarState } from "@/hooks/use-ai-sidebar-state";

type AiSidebarVisibility = Pick<AiSidebarState, "isOpen" | "followsScreenSize">;

// Lets the workspace page read the AI sidebar state owned by EditorShell
// (the toggle lives in the navbar).
export const AiSidebarContext = createContext<AiSidebarVisibility | null>(null);

export function useAiSidebarVisibility(): AiSidebarVisibility {
  const visibility = use(AiSidebarContext);
  if (!visibility) {
    throw new Error("useAiSidebarVisibility must be used inside EditorShell");
  }
  return visibility;
}
