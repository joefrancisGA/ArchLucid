"use client";

import { cn } from "@/lib/utils";

import { ProvenanceGraphViewport } from "@/components/provenance/ProvenanceGraphViewport";
import { ProvenanceGraphErrorBoundary } from "@/components/provenance/ProvenanceGraphErrorBoundary";
import { provenanceViewPanelProps } from "@/components/provenance/ProvenanceViewModeSwitcher";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { PROVENANCE_SECTION_GRAPH_LABEL } from "@/lib/provenance-evidence-copy";
import type { ProvenanceNodeFilterCategory } from "@/lib/provenance-node-presentation";
import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";

import { ProvenancePageWorkspaceNodeAside } from "./ProvenancePageWorkspaceNodeAside";

type ProvenanceGraphNode = ArchitectureRunProvenanceGraph["nodes"][number];
type ProvenanceGraphEdge = ArchitectureRunProvenanceGraph["edges"][number];

export type ProvenancePageWorkspaceGraphSectionProps = {
  readonly runId: string;
  readonly graph: ArchitectureRunProvenanceGraph;
  readonly layoutSeed: number;
  readonly selectedNodeId: string | null;
  readonly highlightedEdgeId: string | null;
  readonly activeFilters: Set<ProvenanceNodeFilterCategory>;
  readonly selectedNode: ProvenanceGraphNode | null;
  readonly nodeById: Map<string, ProvenanceGraphNode>;
  readonly incomingEdges: ProvenanceGraphEdge[];
  readonly outgoingEdges: ProvenanceGraphEdge[];
  readonly onSelectNode: (nodeId: string | null) => void;
  readonly setHighlightedEdgeId: (edgeId: string | null) => void;
  readonly onGraphRenderFailed: () => void;
  readonly retryGraphLayout: () => void;
  readonly openTablesView: () => void;
  readonly onSelectEdge: (edgeId: string) => void;
};

export function ProvenancePageWorkspaceGraphSection(
  props: ProvenancePageWorkspaceGraphSectionProps,
): React.JSX.Element {
  const {
    runId,
    graph,
    layoutSeed,
    selectedNodeId,
    highlightedEdgeId,
    activeFilters,
    selectedNode,
    nodeById,
    incomingEdges,
    outgoingEdges,
    onSelectNode,
    setHighlightedEdgeId,
    onGraphRenderFailed,
    retryGraphLayout,
    openTablesView,
    onSelectEdge,
  } = props;

  return (
    <section className="scroll-mt-28" {...provenanceViewPanelProps("graph", true)}>
      <h3 id="prov-graph-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {PROVENANCE_SECTION_GRAPH_LABEL}
      </h3>
      <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
        Explore how evidence, findings, decisions, approval records, and artifacts connect across this review.
      </p>
      <div className="mt-3 w-full min-w-0">
        <ProvenanceGraphErrorBoundary
          key={layoutSeed}
          onRenderFailed={onGraphRenderFailed}
          fallback={
            <ProvenanceGraphViewport
              nodes={graph.nodes}
              edges={graph.edges}
              selectedNodeId={selectedNodeId}
              highlightedEdgeId={highlightedEdgeId}
              activeFilters={activeFilters}
              layoutSeed={layoutSeed}
              onSelectNode={onSelectNode}
              onHighlightEdge={setHighlightedEdgeId}
              renderFailed
              onRetryRender={retryGraphLayout}
              onOpenTablesView={openTablesView}
            />
          }
        >
          <ProvenanceGraphViewport
            nodes={graph.nodes}
            edges={graph.edges}
            selectedNodeId={selectedNodeId}
            highlightedEdgeId={highlightedEdgeId}
            activeFilters={activeFilters}
            layoutSeed={layoutSeed}
            onSelectNode={onSelectNode}
            onHighlightEdge={setHighlightedEdgeId}
            onRetryRender={retryGraphLayout}
            onOpenTablesView={openTablesView}
          />
        </ProvenanceGraphErrorBoundary>
      </div>

      {selectedNode !== null ? (
        <ProvenancePageWorkspaceNodeAside
          runId={runId}
          selectedNode={selectedNode}
          graphNodes={graph.nodes}
          nodeById={nodeById}
          incomingEdges={incomingEdges}
          outgoingEdges={outgoingEdges}
          onSelectEdge={onSelectEdge}
        />
      ) : null}
    </section>
  );
}
