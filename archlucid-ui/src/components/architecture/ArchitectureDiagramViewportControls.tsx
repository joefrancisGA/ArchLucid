import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ARCHITECTURE_DIAGRAM_ZOOM_PERCENT_LABEL } from '@/lib/architecture/architecture-diagram-copy';
import { OPERATOR_TYPOGRAPHY } from '@/lib/design-tokens';

export type ArchitectureDiagramViewportControlsProps = {
  readonly zoomPercentInputValue: string;
  readonly minZoomPercent: number;
  readonly maxZoomPercent: number;
  readonly atMinZoom: boolean;
  readonly atMaxZoom: boolean;
  readonly onZoomPercentDraftChange: (value: string) => void;
  readonly onZoomPercentFocus: () => void;
  readonly onCommitZoomPercent: (raw: string) => void;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onResetZoom: () => void;
  readonly onFitInView: () => void;
  readonly zoomInLabel: string;
  readonly zoomOutLabel: string;
  readonly resetZoomLabel: string;
  readonly fitInViewLabel: string;
  readonly viewportHint: string;
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
          {props.zoomOutLabel}
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
            className={cn('h-8 w-[4.75rem] px-2 text-center tabular-nums', OPERATOR_TYPOGRAPHY.helper)}
            value={props.zoomPercentInputValue}
            onChange={(event) => props.onZoomPercentDraftChange(event.target.value)}
            onFocus={props.onZoomPercentFocus}
            onBlur={(event) => props.onCommitZoomPercent(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                props.onCommitZoomPercent(event.currentTarget.value);
                event.currentTarget.blur();
              }
            }}
          />
          <span className={cn('text-al-text-secondary', OPERATOR_TYPOGRAPHY.helper)} aria-hidden="true">
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
          {props.zoomInLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          title="Keyboard: 0 after focusing the diagram"
          onClick={props.onResetZoom}
        >
          {props.resetZoomLabel}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={props.onFitInView}>
          {props.fitInViewLabel}
        </Button>
      </div>
      <p
        className={cn('m-0 text-al-text-secondary', OPERATOR_TYPOGRAPHY.helper)}
        data-testid="architecture-diagram-viewport-hint"
      >
        {props.viewportHint}
      </p>
    </div>
  );
}
