"use client";

import { FileText, Sparkles } from "lucide-react";

import { AiChatPanel } from "@/components/editor/ai-chat-panel";
import { useAiSidebarVisibility } from "@/components/editor/ai-sidebar-context";
import { AiSpecsPanel } from "@/components/editor/ai-specs-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAiChat } from "@/hooks/use-ai-chat";
import { cn } from "@/lib/utils";

// AI sidebar with the AI Architect chat and the Specs tab (UI only for
// now). Floats over the right edge of the canvas, like the project sidebar
// on the left, and slides off-screen when closed. Opened and closed from
// the navbar. The parent container must be `relative`.
export function AiSidebar() {
  const { isOpen, followsScreenSize } = useAiSidebarVisibility();
  // Owned here, not in the tab panel: inactive panels unmount, and the
  // draft must survive switching tabs (the messages live in the room).
  const chat = useAiChat();

  return (
    <aside
      aria-label="AI sidebar"
      inert={!isOpen}
      className={cn(
        // nokey: React Flow ignores keys pressed in here (Space or
        // Backspace on a focused button must not pan or delete).
        "nokey absolute inset-y-2 right-2 z-20 flex w-80 max-w-[calc(100%-1rem)] flex-col rounded-xl border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-lg transition-transform duration-200 ease-out",
        // Until the user toggles it, CSS picks the state by screen size so
        // the first paint is right before the client knows the width.
        followsScreenSize
          ? "translate-x-[calc(100%+0.5rem)] lg:translate-x-0"
          : isOpen
            ? "translate-x-0"
            : "translate-x-[calc(100%+0.5rem)]",
      )}
    >
      <Tabs defaultValue="architect" className="min-h-0 flex-1 gap-0">
        <div className="shrink-0 border-b border-sidebar-border p-3">
          <TabsList aria-label="AI sidebar sections" className="w-full">
            <TabsTrigger value="architect">
              <Sparkles data-icon="inline-start" />
              AI Architect
            </TabsTrigger>
            <TabsTrigger value="specs">
              <FileText data-icon="inline-start" />
              Specs
            </TabsTrigger>
          </TabsList>
        </div>
        {/* Base UI keeps the panel being left mounted until its exit
            transition ends; hide it so the two never share the height. */}
        <TabsContent
          value="architect"
          className="flex min-h-0 flex-col data-ending-style:hidden"
        >
          <AiChatPanel chat={chat} />
        </TabsContent>
        <TabsContent
          value="specs"
          className="min-h-0 overflow-y-auto data-ending-style:hidden"
        >
          <AiSpecsPanel />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
