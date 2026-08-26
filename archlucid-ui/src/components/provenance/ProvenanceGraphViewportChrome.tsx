import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  Expand,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  Shrink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PROVENANCE_GRAPH_ZOOM_STEP } from "@/lib/provenance-graph-viewport";

export type ProvenanceGraphViewportChromeProps = {
  readonly expanded: boolean;
  readonly onExpandedChange: (expanded: boolean) => void;
  readonly onZoomBy: (factor: number) => void;
  readonly onFitToView: () => void;
  readonly onResetLayout: () => void;
};

export function ProvenanceGraphViewportControls(props: ProvenanceGraphViewportChromeProps): React.JSX.Element {
  return (
    <div
      className="absolute right-2 top-2 flex flex-wrap items-center justify-end gap-1"
      data-provenance-graph-controls="true"
      data-testid="provenance-graph-controls"
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 bg-white/95 dark:bg-neutral-950/95"
        aria-label="Zoom in (Ctrl + scroll)"
        onClick={() => props.onZoomBy(PROVENANCE_GRAPH_ZOOM_STEP)}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 bg-white/95 dark:bg-neutral-950/95"
        aria-label="Zoom out (Ctrl + scroll)"
        onClick={() => props.onZoomBy(1 / PROVENANCE_GRAPH_ZOOM_STEP)}
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 bg-white/95 dark:bg-neutral-950/95"
        aria-label="Fit graph to view"
        onClick={() => props.onFitToView()}
      >
        <Maximize2 className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 bg-white/95 dark:bg-neutral-950/95"
        aria-label="Reset graph layout"
        onClick={props.onResetLayout}
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 bg-white/95 dark:bg-neutral-950/95"
        aria-label={props.expanded ? "Exit expanded graph view" : "Expand graph view"}
        onClick={() => props.onExpandedChange(!props.expanded)}
      >
        {props.expanded ? <Shrink className="h-4 w-4" aria-hidden="true" /> : <Expand className="h-4 w-4" aria-hidden="true" />}
      </Button>
    </div>
  );
}

export function ProvenanceGraphViewportFooterHint(): React.JSX.Element {
  return (
    <p className={cn("m-0 px-3 py-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
      Drag to pan. Ctrl + scroll to zoom. Tab to select nodes; Enter opens node details.
    </p>
  );
}

export function ProvenanceGraphViewportFocusStyles(): React.JSX.Element {
  return (
    <style>{`
        .prov-graph-node-dimmed,
        .prov-graph-edge-dimmed {
          opacity: 0.28;
        }

        [data-provenance-node="true"]:focus-visible .prov-node-focus-indicator {
          opacity: 1;
        }
      `}</style>
  );
}
