"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { ProvenanceBuyerChrome } from "@/components/provenance/ProvenanceBuyerChrome";
import { ProvenanceSectionNav } from "@/components/provenance/ProvenanceSectionNav";
import { ProvenancePageWorkspaceFilters } from "@/components/provenance/ProvenancePageWorkspaceFilters";
import { ProvenancePageWorkspaceHeader } from "@/components/provenance/ProvenancePageWorkspaceHeader";
import { ProvenancePageWorkspaceTimeline } from "@/components/provenance/ProvenancePageWorkspaceTimeline";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  PROVENANCE_BUYER_START_HERE_HELPER,
  PROVENANCE_FIRST_VIEWPORT_TEST_ID,
  PROVENANCE_PAGE_LEAD,
  PROVENANCE_PRIMARY_CONTENT_ID,
  PROVENANCE_SKIP_LINK_LABEL,
  PROVENANCE_SKIP_TARGET_ID,
  PROVENANCE_START_HERE_CARD_TITLE,
} from "@/lib/provenance-page-copy";
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
  const buyerPolishedShell = useProductionEvalChrome();
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
    pathname,
    currentSearch,
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
      <a
        href={`#${PROVENANCE_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {PROVENANCE_SKIP_LINK_LABEL}
      </a>

      <div
        id={PROVENANCE_PRIMARY_CONTENT_ID}
        data-testid={PROVENANCE_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
      >
        <div className={cn("flex flex-col xl:flex-row xl:items-start", OPERATOR_LAYOUT.unrelatedClusterGap, "xl:gap-6")}>
          <article className={cn("min-w-0 flex-1 text-neutral-800 dark:text-neutral-200", OPERATOR_LAYOUT.sectionStack)}>
            {!buyerPolishedShell ? <ProvenanceSectionNav sections={sections} placement="inline-top" /> : null}

            <ProvenancePageWorkspaceHeader
              dataOrigin={dataOrigin}
              scopedRunId={scopedRunId}
              onPickReviewForInspecting={onPickReviewForInspecting}
              reviewHref={reviewHref}
              reviewContext={reviewContext ?? null}
              reviewTitle={reviewTitle}
              graph={graph}
              provenanceTraceId={provenanceTraceId}
              buyerPolishedShell={buyerPolishedShell}
            />

            <div
              id={PROVENANCE_SKIP_TARGET_ID}
              data-testid={PROVENANCE_FIRST_VIEWPORT_TEST_ID}
              className={cn(
                buyerPolishedShell ? "space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800" : "space-y-4",
                OPERATOR_LAYOUT.sectionStack,
              )}
            >
              {buyerPolishedShell ? (
                <div className="space-y-4" data-testid="provenance-buyer-first-viewport-intro">
                  <p
                    className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
                    data-testid="provenance-intro"
                  >
                    {PROVENANCE_PAGE_LEAD}
                  </p>
                  <section
                    className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
                    data-testid="provenance-start-here-panel"
                    aria-labelledby="provenance-start-here-heading"
                  >
                    <h2
                      id="provenance-start-here-heading"
                      className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
                    >
                      {PROVENANCE_START_HERE_CARD_TITLE}
                    </h2>
                    <p
                      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                      data-testid="provenance-buyer-start-here-helper"
                    >
                      {PROVENANCE_BUYER_START_HERE_HELPER}
                    </p>
                  </section>
                </div>
              ) : null}

          {hasScopedRun && !buyerPolishedShell ? (
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
                pathname={pathname}
                currentSearch={currentSearch}
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
                  showInspectCoach={!buyerPolishedShell && provenanceInspectEmphasizedStepId === "inspect"}
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
            </div>

            {buyerPolishedShell ? (
              <ProvenanceBuyerChrome runId={scopedRunId} architectureId={null} />
            ) : null}
          </article>

          {!buyerPolishedShell ? <ProvenanceSectionNav sections={sections} placement="sidebar" /> : null}
        </div>

        {hasScopedRun && !buyerPolishedShell ? <ProvenanceNextReviewFooterClient runId={runId} /> : null}
      </div>

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
