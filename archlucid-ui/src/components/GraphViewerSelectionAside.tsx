"use client";

import { GraphViewerEdgeOrTrailDetail } from "@/components/GraphViewerEdgeOrTrailDetail";
import { GraphViewerNodeDetailPanel } from "@/components/GraphViewerNodeDetailPanel";
import { GraphViewerSelectionSettings } from "@/components/GraphViewerSelectionSettings";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { GraphEdgeVm, GraphNodeVm } from "@/types/graph";

export type GraphViewerSelectionAsideProps = {
  readonly buyerTrailPanel: boolean;
  readonly compactChrome: boolean;
  readonly interactiveSurfaceReady: boolean;
  readonly isAdvanced: boolean;
  readonly onToggleAdvanced: () => void;
  readonly edgeInferenceThreshold: string;
  readonly onEdgeInferenceThresholdChange: (value: string) => void;
  readonly selectedEdge: GraphEdgeVm | null;
  readonly selectedNode: GraphNodeVm | null;
  readonly selectionBreadcrumb: readonly string[];
  readonly runId: string;
  readonly explainStatusLine: string;
  readonly onExplainStatusLineChange: (value: string) => void;
  readonly explainAggregateHref: string | null;
  readonly onExplainAggregateHrefChange: (value: string | null) => void;
};

export function GraphViewerSelectionAside({
  buyerTrailPanel,
  compactChrome,
  interactiveSurfaceReady,
  isAdvanced,
  onToggleAdvanced,
  edgeInferenceThreshold,
  onEdgeInferenceThresholdChange,
  selectedEdge,
  selectedNode,
  selectionBreadcrumb,
  runId,
  explainStatusLine,
  onExplainStatusLineChange,
  explainAggregateHref,
  onExplainAggregateHrefChange,
}: GraphViewerSelectionAsideProps): React.ReactElement {
  return (
    <aside
      aria-label="Graph settings and selection details"
      className={
        buyerTrailPanel
          ? "max-h-[min(88vh,960px)] flex min-h-[520px] flex-col gap-4 overflow-auto rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
          : compactChrome
            ? "max-h-[min(55vh,520px)] flex flex-col gap-4 overflow-auto rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950 lg:max-h-[min(55vh,520px)]"
            : "max-h-[70vh] flex flex-col gap-4 overflow-auto rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
      }
    >
      <GraphViewerSelectionSettings
        buyerTrailPanel={buyerTrailPanel}
        compactChrome={compactChrome}
        interactiveSurfaceReady={interactiveSurfaceReady}
        isAdvanced={isAdvanced}
        onToggleAdvanced={onToggleAdvanced}
        edgeInferenceThreshold={edgeInferenceThreshold}
        onEdgeInferenceThresholdChange={onEdgeInferenceThresholdChange}
      />

      <div className="flex-1">
        {!selectedEdge && !selectedNode && !interactiveSurfaceReady ? (
          <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>Rendering graph…</p>
        ) : null}

        {!selectedEdge && !selectedNode && interactiveSurfaceReady && !buyerTrailPanel ? (
          <p>Select a node or inferred edge on the canvas to inspect reasoning and metadata.</p>
        ) : null}

        {!selectedEdge && !selectedNode && interactiveSurfaceReady && buyerTrailPanel ? (
          <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Select a node or edge on the canvas to see technical details.
          </p>
        ) : null}

        {selectedEdge ? (
          <GraphViewerEdgeOrTrailDetail selectedEdge={selectedEdge} buyerTrailPanel={buyerTrailPanel} />
        ) : null}

        {selectedNode ? (
          <GraphViewerNodeDetailPanel
            selectedNode={selectedNode}
            buyerTrailPanel={buyerTrailPanel}
            compactChrome={compactChrome}
            selectionBreadcrumb={selectionBreadcrumb}
            runId={runId}
            explainStatusLine={explainStatusLine}
            onExplainStatusLineChange={onExplainStatusLineChange}
            explainAggregateHref={explainAggregateHref}
            onExplainAggregateHrefChange={onExplainAggregateHrefChange}
          />
        ) : null}
      </div>
    </aside>
  );
}
