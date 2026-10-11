import type { CanvasShape } from "@/lib/canvas-shapes";
import { cn } from "@/lib/utils";

type ShapeOutlineProps = {
  shape: CanvasShape;
  width: number;
  height: number;
  className: string;
  strokeWidth: number;
};

// Draws a shape's outline in an SVG, from (0, 0) to (width, height). The
// one place shape geometry lives: shape nodes and the shape panel's drag
// preview both draw with it, so they always match.
export function ShapeOutline({ shape, width: w, height: h, ...paint }: ShapeOutlineProps) {
  switch (shape) {
    case "rectangle":
      return <rect width={w} height={h} rx={8} {...paint} />;
    case "diamond":
      return (
        <polygon
          points={`${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`}
          {...paint}
        />
      );
    case "circle":
      return <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} {...paint} />;
    case "pill":
      return <rect width={w} height={h} rx={Math.min(w, h) / 2} {...paint} />;
    case "cylinder": {
      // Body with a rounded bottom, plus the front edge of the lid.
      const ry = Math.min(12, h / 4);
      return (
        <>
          <path
            d={`M0,${ry} L0,${h - ry} A${w / 2},${ry} 0 0 0 ${w},${h - ry} L${w},${ry} A${w / 2},${ry} 0 0 0 0,${ry} Z`}
            {...paint}
          />
          <path
            d={`M0,${ry} A${w / 2},${ry} 0 0 0 ${w},${ry}`}
            {...paint}
            className={cn(paint.className, "fill-none")}
          />
        </>
      );
    }
    case "hexagon": {
      const inset = Math.min(w / 4, h / 2);
      return (
        <polygon
          points={`${inset},0 ${w - inset},0 ${w},${h / 2} ${w - inset},${h} ${inset},${h} 0,${h / 2}`}
          {...paint}
        />
      );
    }
  }
}
