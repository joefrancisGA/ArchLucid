import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  ARCHITECTURE_DIAGRAM_FIT_TO_VIEW_LABEL,
  ARCHITECTURE_DIAGRAM_FULLSCREEN_ACTION,
  ARCHITECTURE_DIAGRAM_RESET_ZOOM_LABEL,
  ARCHITECTURE_DIAGRAM_VIEWPORT_HINT,
  ARCHITECTURE_DIAGRAM_ZOOM_IN_LABEL,
  ARCHITECTURE_DIAGRAM_ZOOM_OUT_LABEL,
} from "@/lib/architecture/architecture-diagram-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureDiagramViewportControlsProps = {
  readonly zoomPercentLabel: string;
  readonly atMinZoom: boolean;
  readonly atMaxZoom: boolean;
  readonly canvasStale: boolean;
  readonly onZoomOut: () => void;
  readonly onZoomIn: () => void;
  readonly onResetZoom: () => void;
  readonly onFitToView: () => void;
  readonly onFullscreen: () => void;
};

/** Labeled zoom and pan controls for the architecture / inventory diagram canvas. */
export function ArchitectureDiagramViewportControls(
  props: ArchitectureDiagramViewportControlsProps,
): React.JSX.Element {
  return (
    <div
      className="mb-2 flex flex-col gap-2"
      data-testid="architecture-diagram-viewport-controls"
      aria-label="Diagram viewport controls"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          title="Keyboard: − after focusing the diagram"
          disabled={props.atMinZoom}
          onClick={props.onZoomOut}
        >
          {ARCHITECTURE_DIAGRAM_ZOOM_OUT_LABEL}
        </Button>
        <span
          className={cn("min-w-[3.25rem] text-center tabular-nums text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="architecture-diagram-zoom-readout"
          aria-live="polite"
        >
          {props.zoomPercentLabel}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          title="Keyboard: + after focusing the diagram"
          disabled={props.atMaxZoom}
          onClick={props.onZoomIn}
        >
          {ARCHITECTURE_DIAGRAM_ZOOM_IN_LABEL}
        </Button>
        <Button type="button" variant="outline" size="sm" title="Keyboard: 0 after focusing the diagram" onClick={props.onResetZoom}>
          {ARCHITECTURE_DIAGRAM_RESET_ZOOM_LABEL}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={props.onFitToView}>
          {ARCHITECTURE_DIAGRAM_FIT_TO_VIEW_LABEL}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={props.onFullscreen}>
          {ARCHITECTURE_DIAGRAM_FULLSCREEN_ACTION}
        </Button>
        {props.canvasStale ? (
          <span className={cn("text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>
            Canvas may be stale while a new render loads.
          </span>
        ) : null}
      </div>
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="architecture-diagram-viewport-hint"
      >
        {ARCHITECTURE_DIAGRAM_VIEWPORT_HINT}
      </p>
    </div>
  );
}
