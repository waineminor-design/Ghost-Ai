import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface EditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  // Action buttons rendered in the dialog footer.
  footer?: ReactNode;
  // Extra classes for the dialog panel, e.g. a wider max width.
  className?: string;
  children?: ReactNode;
}

// Shared dialog pattern for editor flows. Styling comes from the
// theme tokens in app/globals.css.
export function EditorDialog({
  open,
  onOpenChange,
  title,
  description,
  footer,
  className,
  children,
}: EditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "border border-border bg-popover text-popover-foreground",
          className,
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        {footer && (
          <DialogFooter className="border-border bg-muted/50">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
