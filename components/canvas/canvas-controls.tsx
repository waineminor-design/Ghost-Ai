import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { useCanRedo, useCanUndo } from "@liveblocks/react/suspense";
import { Panel } from "@xyflow/react";
import { Maximize, Redo2, Undo2, ZoomIn, ZoomOut, type LucideIcon } from "lucide-react";

import { useProjectSidebarVisibility } from "@/components/editor/project-sidebar-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCanvasActions } from "@/hooks/use-canvas-actions";
import { cn } from "@/lib/utils";

// Floating pill at the bottom-left of the canvas: zoom out, zoom in, fit
// view, undo, redo. While the project sidebar is open (md and up) the bar
// slides right of it; where the canvas is too narrow for the bar and the
// centered shape panel side by side, it sits above the shape panel.
// Must render inside <ReactFlow>, a RoomProvider and EditorShell.
export function CanvasControls() {
  const actions = useCanvasActions();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const { isOpen: isProjectSidebarOpen } = useProjectSidebarVisibility();
  // The canvas only renders in the browser, so navigator is available.
  const mod = /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl+";

  return (
    <Panel
      position="bottom-left"
      role="group"
      aria-label="Canvas controls"
      // nokey: Space or Backspace pressed on a focused button doesn't pan
      // the canvas or delete the selected nodes.
      className={cn(
        "nokey flex items-center gap-1 rounded-full border border-border bg-card p-1.5 shadow-lg transition-transform duration-200 ease-out",
        // Lifting clears the shape panel: it is 3rem + 2px tall (size-9
        // buttons, p-1.5, 1px border), plus a 0.5rem gap. The project
        // sidebar is w-72 at left-2, so 18.5rem moves the bar just past
        // it; side by side with the shape panel then needs ~83rem.
        isProjectSidebarOpen
          ? "max-[83rem]:-translate-y-[calc(3.5rem+2px)] md:translate-x-[18.5rem]"
          : "max-md:-translate-y-[calc(3.5rem+2px)]",
      )}
    >
      <TooltipProvider>
        <ControlButton label="Zoom out" shortcut="-" icon={ZoomOut} onClick={actions.zoomOut} />
        <ControlButton label="Zoom in" shortcut="+" icon={ZoomIn} onClick={actions.zoomIn} />
        <ControlButton label="Fit view" icon={Maximize} onClick={actions.fitView} />
        <span aria-hidden className="mx-0.5 h-5 w-px bg-border" />
        <ControlButton
          label="Undo"
          shortcut={`${mod}Z`}
          icon={Undo2}
          onClick={actions.undo}
          disabled={!canUndo}
        />
        <ControlButton
          label="Redo"
          shortcut={`${mod}Y`}
          icon={Redo2}
          onClick={actions.redo}
          disabled={!canRedo}
        />
      </TooltipProvider>
    </Panel>
  );
}

type ControlButtonProps = {
  label: string;
  shortcut?: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
};

// Disabled buttons stay focusable (aria-disabled instead of the disabled
// attribute) so they still show their tooltip on hover, and focus isn't
// lost when undoing the last change disables the button under it.
function ControlButton({ label, shortcut, icon: Icon, onClick, disabled = false }: ControlButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<ButtonPrimitive focusableWhenDisabled disabled={disabled} />}
        aria-label={label}
        onClick={onClick}
        className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:not-data-disabled:bg-accent hover:not-data-disabled:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring data-disabled:opacity-50"
      >
        <Icon className="size-5" aria-hidden />
      </TooltipTrigger>
      <TooltipContent>{shortcut ? `${label} (${shortcut})` : label}</TooltipContent>
    </Tooltip>
  );
}
