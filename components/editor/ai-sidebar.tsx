"use client";

import { useCallback, useState } from "react";
import { FileText, Sparkles } from "lucide-react";

import { AiChatPanel } from "@/components/editor/ai-chat-panel";
import { useAiSidebarVisibility } from "@/components/editor/ai-sidebar-context";
import { AiSpecsPanel } from "@/components/editor/ai-specs-panel";
import { DesignRunFollower } from "@/components/editor/design-run-follower";
import { SpecPreviewDialog } from "@/components/editor/spec-preview-dialog";
import { SpecRunFollower } from "@/components/editor/spec-run-follower";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAiChat } from "@/hooks/use-ai-chat";
import { useDesignRun } from "@/hooks/use-design-run";
import { useSpecRun } from "@/hooks/use-spec-run";
import { cn } from "@/lib/utils";

// AI sidebar with the AI Architect chat and the Specs tab. Floats over the right edge of the canvas, like the project sidebar
// on the left, and slides off-screen when closed. Opened and closed from
// the navbar. The parent container must be `relative`. Must render inside
// the project's RoomProvider and ReactFlowProvider.
export function AiSidebar({ projectId }: { projectId: string }) {
  const { isOpen, followsScreenSize } = useAiSidebarVisibility();
  // Owned here, not in the tab panels: inactive panels unmount, and the
  // draft, the runs this user started and the open spec preview must
  // survive switching tabs (the messages and specs live in the room and
  // the database).
  const chat = useAiChat();
  const designRun = useDesignRun(projectId);
  const { followed } = designRun;
  const [specListKey, setSpecListKey] = useState(0);
  // The previewed spec stays set while the dialog closes, so its content
  // stays during the exit animation.
  const [preview, setPreview] = useState<{ specId: string | null; open: boolean }>({
    specId: null,
    open: false,
  });
  const openPreview = useCallback((specId: string) => setPreview({ specId, open: true }), []);
  const specRun = useSpecRun(
    projectId,
    useCallback(
      (specId: string | null) => {
        setSpecListKey((key) => key + 1);
        if (specId) openPreview(specId);
      },
      [openPreview],
    ),
  );

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
      {followed && (
        <DesignRunFollower
          key={followed.runId}
          runId={followed.runId}
          token={followed.token}
          onEnd={designRun.end}
        />
      )}
      {specRun.followed && (
        <SpecRunFollower
          key={specRun.followed.runId}
          runId={specRun.followed.runId}
          token={specRun.followed.token}
          onStep={specRun.report}
          onEnd={specRun.end}
        />
      )}
      {/* Renders in a portal, outside the sidebar, so a closed (inert)
          sidebar doesn't block it. */}
      <SpecPreviewDialog
        projectId={projectId}
        specId={preview.specId}
        open={preview.open}
        onOpenChange={(open) => setPreview((current) => ({ ...current, open }))}
      />
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
          <AiChatPanel chat={chat} designRun={designRun} />
        </TabsContent>
        <TabsContent
          value="specs"
          className="min-h-0 overflow-y-auto data-ending-style:hidden"
        >
          <AiSpecsPanel
            projectId={projectId}
            specRun={specRun}
            refreshKey={specListKey}
            onPreview={openPreview}
          />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
