import { UserButton } from "@clerk/nextjs";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
}: EditorNavbarProps) {
  const ToggleIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen;

  return (
    <header className="grid h-12 shrink-0 grid-cols-3 items-center border-b border-border bg-background px-2">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={isSidebarOpen}
        >
          <ToggleIcon className="size-5" />
        </Button>
      </div>
      <div className="flex items-center justify-center" />
      <div className="flex items-center justify-end">
        <UserButton />
      </div>
    </header>
  );
}
