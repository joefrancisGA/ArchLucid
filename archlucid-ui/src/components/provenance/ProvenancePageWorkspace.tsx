"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { ProvenanceSectionNav } from "@/components/provenance/ProvenanceSectionNav";
import { ProvenancePageWorkspaceFilters } from "@/components/provenance/ProvenancePageWorkspaceFilters";
import { ProvenancePageWorkspaceHeader } from "@/components/provenance/ProvenancePageWorkspaceHeader";
import { ProvenancePageWorkspaceTimeline } from "@/components/provenance/ProvenancePageWorkspaceTimeline";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import {
  resolveProvenanceInspectEmphasizedStepId,
  resolveProvenanceInspectSteps,
} from "@/lib/provenance-inspect-checklist";

import type { ProvenancePageWorkspaceProps } from "./provenance-page-workspace-types";
import { FILTER_OPTIONS, useProvenancePageWorkspace } from "./use-provenance-page-workspace";
import { ProvenanceNextReviewFooterClient } from "./ProvenanceNextReviewFooterClient";
import { ProvenancePageWorkspaceGraphSection } from "./ProvenancePageWorkspaceGraphSection";
import { ProvenancePageWorkspaceTablesSection } from "./ProvenancePageWorkspaceTablesSection";

export type { ProvenancePageWorkspaceProps, ProvenanceReviewContext } from "./provenance-page-workspace-types";

export function ProvenancePageWorkspace(props: ProvenancePageWorkspaceProps): React.JSX.Element {
  const router = useRouter();
  const {
    runId,
    provenanceTraceId,
    reviewContext,
    dataOrigin,
    graph,
    viewMode,
    setViewMode,
    selectedNodeId,
    highlightedEdgeId,
    setHighlightedEdgeId,
    activeFilters,
    layoutSeed,
    edgesExpanded,
    setEdgesExpanded,
    nodeSearch,
    setNodeSearch,
    nodeTypeFilter,
    setNodeTypeFilter,
    edgeSearch,
    setEdgeSearch,
    nodeById,
    sections,
    selectedNode,
    incomingEdges,
    outgoingEdges,
    filterCounts,
    filteredNodesForTable,
    filteredEdgesForTable,
    nodeTypes,
    graphVisibleNodeCount,
    onSelectNode,
    onSelectEdge,
    toggleFilter,
    onGraphRenderFailed,
    openTablesView,
    retryGraphLayout,
    reviewTitle,
    reviewHref,
    showGraph,
    showTimeline,
    showTables,
    evidenceGraphHref,
  } = useProvenancePageWorkspace(props);
  const scopedRunId = runId.trim();
  const hasScopedRun = scopedRunId.length > 0;
  const provenanceInspectSteps = resolveProvenanceInspectSteps({
    reviewPicked: hasScopedRun,
    provenanceLoaded: graph.nodes.length > 0,
    inspectComplete: (selectedNodeId ?? "").trim().length > 0,
  });
  const provenanceInspectEmphasizedStepId = resolveProvenanceInspectEmphasizedStepId({
    reviewPicked: hasScopedRun,
    provenanceLoaded: graph.nodes.length > 0,
    inspectComplete: (selectedNodeId ?? "").trim().length > 0,
  });

  const onPickReviewForInspecting = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      router.push(`/architecture/reviews/${encodeURIComponent(trimmed)}/provenance`);
    },
    [router],
  );

  return (
    <OperatorPageContainer variant="dashboard" className="print:w-full" data-testid="provenance-page-workspace">
      <div className={cn("flex flex-col xl:flex-row xl:items-start", OPERATOR_LAYOUT.unrelatedClusterGap, "xl:gap-6")}>
        <article className={cn("min-w-0 flex-1 text-neutral-800 dark:text-neutral-200", OPERATOR_LAYOUT.sectionStack)}>
          <ProvenanceSectionNav sections={sections} placement="inline-top" />

          <ProvenancePageWorkspaceHeader
            dataOrigin={dataOrigin}
            scopedRunId={scopedRunId}
            onPickReviewForInspecting={onPickReviewForInspecting}
            reviewHref={reviewHref}
            reviewContext={reviewContext ?? null}
            reviewTitle={reviewTitle}
            graph={graph}
            provenanceTraceId={provenanceTraceId}
            evidenceGraphHref={evidenceGraphHref}
          />

          {hasScopedRun ? (
            <IntegrationConnectChecklist
              title="Inspect checklist"
              steps={provenanceInspectSteps}
              emphasizedStepId={provenanceInspectEmphasizedStepId}
              testIdPrefix="provenance-inspect"
            />
          ) : null}

          {hasScopedRun ? (
            <>
              <ProvenancePageWorkspaceFilters
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                filterOptions={FILTER_OPTIONS}
                activeFilters={activeFilters}
                filterCounts={filterCounts}
                onToggleFilter={(filterId) => {
                  toggleFilter(filterId as (typeof FILTER_OPTIONS)[number]["id"]);
                }}
                graphVisibleNodeCount={graphVisibleNodeCount}
                totalNodeCount={graph.nodes.length}
              />

              {showGraph ? (
                <ProvenancePageWorkspaceGraphSection
                  runId={runId}
                  graph={graph}
                  layoutSeed={layoutSeed}
                  selectedNodeId={selectedNodeId}
                  highlightedEdgeId={highlightedEdgeId}
                  activeFilters={activeFilters}
                  selectedNode={selectedNode}
                  nodeById={nodeById}
                  incomingEdges={incomingEdges}
                  outgoingEdges={outgoingEdges}
                  onSelectNode={onSelectNode}
                  setHighlightedEdgeId={setHighlightedEdgeId}
                  onGraphRenderFailed={onGraphRenderFailed}
                  retryGraphLayout={retryGraphLayout}
                  openTablesView={openTablesView}
                  onSelectEdge={onSelectEdge}
                />
              ) : null}

              {showTimeline ? (
                <ProvenancePageWorkspaceTimeline
                  runId={runId}
                  graph={graph}
                  viewMode={viewMode}
                  onSelectNode={onSelectNode}
                />
              ) : null}

              {showTables ? (
                <ProvenancePageWorkspaceTablesSection
                  runId={runId}
                  graph={graph}
                  selectedNodeId={selectedNodeId}
                  highlightedEdgeId={highlightedEdgeId}
                  nodeSearch={nodeSearch}
                  setNodeSearch={setNodeSearch}
                  nodeTypeFilter={nodeTypeFilter}
                  setNodeTypeFilter={setNodeTypeFilter}
                  edgeSearch={edgeSearch}
                  setEdgeSearch={setEdgeSearch}
                  edgesExpanded={edgesExpanded}
                  setEdgesExpanded={setEdgesExpanded}
                  filteredNodesForTable={filteredNodesForTable}
                  filteredEdgesForTable={filteredEdgesForTable}
                  nodeTypes={nodeTypes}
                  nodeById={nodeById}
                  onSelectNode={onSelectNode}
                  onSelectEdge={onSelectEdge}
                />
              ) : null}
            </>
          ) : null}
        </article>

        <ProvenanceSectionNav sections={sections} placement="sidebar" />
      </div>

      {hasScopedRun ? <ProvenanceNextReviewFooterClient runId={runId} /> : null}

      <style>{`
        .prov-node-row--flash {
          outline: 2px solid var(--al-accent-interactive);
          background: color-mix(in srgb, var(--al-accent-interactive) 12%, transparent);
          transition: background 0.3s ease;
        }
      `}</style>
    </OperatorPageContainer>
  );
}
