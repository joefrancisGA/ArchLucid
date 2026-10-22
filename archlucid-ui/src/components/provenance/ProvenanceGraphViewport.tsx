"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Button } from "@/components/ui/button";
import { PROVENANCE_GRAPH_MIN_HEIGHT_PX } from "@/lib/provenance-graph-viewport";
import type { ProvenanceNodeFilterCategory } from "@/lib/provenance-node-presentation";
import type { ArchitectureLinkageEdge, ArchitectureLinkageNode } from "@/types/architecture-provenance";

import { ProvenanceGraphLegend } from "./ProvenanceGraphLegend";
import { ProvenanceGraphViewportCanvas } from "./ProvenanceGraphViewportCanvas";
import {
  ProvenanceGraphViewportControls,
  ProvenanceGraphViewportFocusStyles,
  ProvenanceGraphViewportFooterHint,
} from "./ProvenanceGraphViewportChrome";
import { useProvenanceGraphViewport } from "./use-provenance-graph-viewport";

export type ProvenanceGraphViewportProps = {
  readonly nodes: readonly ArchitectureLinkageNode[];
  readonly edges: readonly ArchitectureLinkageEdge[];
  readonly selectedNodeId: string | null;
  readonly highlightedEdgeId: string | null;
  readonly activeFilters: ReadonlySet<ProvenanceNodeFilterCategory>;
  readonly layoutSeed: number;
  readonly onSelectNode: (nodeId: string | null) => void;
  readonly onHighlightEdge: (edgeId: string | null) => void;
  readonly renderFailed?: boolean;
  readonly onRetryRender?: () => void;
  readonly onOpenTablesView?: () => void;
};

export function ProvenanceGraphViewport(props: ProvenanceGraphViewportProps): React.JSX.Element {
  const viewport = useProvenanceGraphViewport(props);

  if (props.renderFailed) {
    return (
      <div
        className="rounded-md border border-amber-600/40 bg-al-surface-raised p-4 text-al-text-primary dark:border-amber-700/50"
        data-testid="provenance-graph-fallback"
      >
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
          The provenance graph could not be rendered. Open Timeline or Tables to inspect linkage points and recorded
          events.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {props.onOpenTablesView !== undefined ? (
            <Button type="button" variant="default" size="sm" className="h-8" onClick={props.onOpenTablesView}>
              Open Tables view
            </Button>
          ) : null}
          {props.onRetryRender !== undefined ? (
            <Button type="button" variant="outline" size="sm" className="h-8" onClick={props.onRetryRender}>
              Retry graph
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (props.nodes.length === 0) {
    return (
      <p
        className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
        data-testid="provenance-graph-empty"
      >
        No provenance linkage points recorded for this review.
      </p>
    );
  }

  if (viewport.visibleNodes.length === 0) {
    return (
      <p
        className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
        data-testid="provenance-graph-empty"
      >
        No graph nodes match the current filters.
      </p>
    );
  }

  if (viewport.layoutError !== null) {
    return (
      <div
        className="rounded-md border border-amber-600/40 bg-al-surface-raised p-4 text-al-text-primary dark:border-amber-700/50"
        data-testid="provenance-graph-layout-error"
      >
        <h4 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Graph layout failed</h4>
        <p className={cn("mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{viewport.layoutError}</p>
        {props.onRetryRender !== undefined ? (
          <Button type="button" variant="outline" size="sm" className="mt-3 h-8" onClick={props.onRetryRender}>
            Retry layout
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={viewport.shellClass} data-testid="provenance-graph-viewport" data-expanded={viewport.expanded ? "true" : "false"}>
      <div
        ref={viewport.containerRef}
        className={cn("relative w-full touch-none select-none", viewport.isPanning ? "cursor-grabbing" : "cursor-grab")}
        style={{ height: viewport.viewportHeight, minHeight: PROVENANCE_GRAPH_MIN_HEIGHT_PX }}
        aria-label="Provenance graph viewport"
        onWheel={viewport.onWheel}
        onPointerDown={viewport.onPointerDown}
        onPointerMove={viewport.onPointerMove}
        onPointerUp={viewport.onPointerUp}
        onPointerCancel={viewport.onPointerUp}
        data-testid="provenance-graph-container"
      >
        {viewport.layoutPending || !viewport.graphReady ? (
          <div
            className="absolute inset-0 animate-pulse bg-neutral-100 dark:bg-neutral-900"
            data-testid="provenance-graph-skeleton"
            aria-hidden="true"
          />
        ) : null}

        <ProvenanceGraphViewportCanvas
          svgRef={viewport.svgRef}
          markerId={viewport.markerId}
          transform={viewport.transform}
          graphReady={viewport.graphReady}
          graphSummaryLabel={viewport.graphSummaryLabel}
          visibleEdges={viewport.visibleEdges}
          layoutNodes={viewport.layout.nodes}
          posById={viewport.posById}
          selectedNodeId={viewport.selectedNodeId}
          highlightedEdgeId={viewport.highlightedEdgeId}
          connectedNodeIds={viewport.connectedNodeIds}
          onSelectNode={viewport.handleSelectNode}
        />

        <ProvenanceGraphViewportControls
          expanded={viewport.expanded}
          onExpandedChange={viewport.setExpanded}
          onZoomBy={viewport.zoomBy}
          onFitToView={() => viewport.fitToView()}
          onResetLayout={viewport.resetLayout}
        />

        <ProvenanceGraphLegend
          legendOpen={viewport.legendOpen}
          onLegendOpenChange={viewport.setLegendOpen}
          legendEntries={viewport.legendEntries}
        />
      </div>
      <ProvenanceGraphViewportFooterHint />
      <ProvenanceGraphViewportFocusStyles />
    </div>
  );
}
