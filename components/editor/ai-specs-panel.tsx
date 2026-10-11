import { useId } from "react";
import { Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SKELETON_LINE_WIDTHS = ["w-full", "w-11/12", "w-4/5", "w-full", "w-2/3"];

// The Specs tab. Spec generation isn't built yet: the button is disabled
// and the card only shows what a generated spec will look like.
export function AiSpecsPanel() {
  const statusId = useId();

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Turn the canvas into a technical spec you can download as Markdown.
        </p>
        <Button disabled aria-describedby={statusId} className="w-full">
          <FileText data-icon="inline-start" />
          Generate spec
        </Button>
        <p id={statusId} className="text-xs text-muted-foreground">
          Spec generation is coming soon.
        </p>
      </div>

      <article
        aria-label="Example spec"
        className="flex flex-col gap-3 rounded-lg border border-sidebar-border bg-card p-3 text-card-foreground"
      >
        <div className="flex items-start gap-2">
          <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <h3 className="text-sm font-medium">Technical spec</h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Generated
              {/* The real date appears once specs are generated. */}
              <span aria-hidden="true" className="h-2 w-16 rounded-full bg-muted" />
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="flex flex-col gap-2">
          {SKELETON_LINE_WIDTHS.map((width, index) => (
            <span key={index} className={cn("h-2 rounded-full bg-muted", width)} />
          ))}
        </div>
        <Button variant="outline" size="sm" disabled className="self-start">
          <Download data-icon="inline-start" />
          Download
        </Button>
      </article>
    </div>
  );
}
