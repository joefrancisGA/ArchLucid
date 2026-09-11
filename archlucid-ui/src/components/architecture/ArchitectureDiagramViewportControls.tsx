import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ARCHITECTURE_DIAGRAM_FIT_TO_VIEW_LABEL,
  ARCHITECTURE_DIAGRAM_FULLSCREEN_ACTION,
  ARCHITECTURE_DIAGRAM_RESET_ZOOM_LABEL,
  ARCHITECTURE_DIAGRAM_VIEWPORT_HINT,
  ARCHITECTURE_DIAGRAM_ZOOM_IN_LABEL,
  ARCHITECTURE_DIAGRAM_ZOOM_OUT_LABEL,
  ARCHITECTURE_DIAGRAM_ZOOM_PERCENT_LABEL,
} from "@/lib/architecture/architecture-diagram-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureDiagramViewportControlsProps = {
  readonly zoomPercentInputValue: string;
  readonly minZoomPercent: number;
  readonly maxZoomPercent: number;
  readonly atMinZoom: boolean;
  readonly atMaxZoom: boolean;
  readonly canvasStale: boolean;
  readonly onZoomPercentDraftChange: (value: string) => void;
  readonly onZoomPercentFocus: () => void;
  readonly onCommitZoomPercent: (raw: string) => void;
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
        <div className="flex items-center gap-1" data-testid="architecture-diagram-zoom-readout" aria-live="polite">
          <Input
            type="number"
            min={props.minZoomPercent}
            max={props.maxZoomPercent}
            step="any"
            inputMode="decimal"
            aria-label={ARCHITECTURE_DIAGRAM_ZOOM_PERCENT_LABEL}
            data-testid="architecture-diagram-zoom-input"
            className={cn("h-8 w-[4.75rem] px-2 text-center tabular-nums", OPERATOR_TYPOGRAPHY.helper)}
            value={props.zoomPercentInputValue}
            onChange={(event) => props.onZoomPercentDraftChange(event.target.value)}
            onFocus={props.onZoomPercentFocus}
            onBlur={(event) => props.onCommitZoomPercent(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                props.onCommitZoomPercent(event.currentTarget.value);
                event.currentTarget.blur();
              }
            }}
          />
          <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} aria-hidden="true">
            %
          </span>
        </div>
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
