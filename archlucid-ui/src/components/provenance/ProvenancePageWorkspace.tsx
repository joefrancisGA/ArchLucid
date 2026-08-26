"use client";

import { cn } from "@/lib/utils";
import { MessageSquareText, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { ProvenanceGraphViewport } from "@/components/provenance/ProvenanceGraphViewport";
import { ProvenanceGraphErrorBoundary } from "@/components/provenance/ProvenanceGraphErrorBoundary";
import { ProvenanceSectionNav } from "@/components/provenance/ProvenanceSectionNav";
import { ProvenancePageWorkspaceFilters } from "@/components/provenance/ProvenancePageWorkspaceFilters";
import { ProvenancePageWorkspaceHeader } from "@/components/provenance/ProvenancePageWorkspaceHeader";
import { ProvenancePageWorkspaceTimeline } from "@/components/provenance/ProvenancePageWorkspaceTimeline";
import { provenanceViewPanelProps } from "@/components/provenance/ProvenanceViewModeSwitcher";
import { ProvenanceNodeExplainCell } from "@/components/ProvenanceNodeExplainCell";
import { ProvenanceReferenceLink } from "@/components/ProvenanceReferenceLink";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { Input } from "@/components/ui/input";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buyerTrailEdgeDisplayPhrase } from "@/lib/graph-mapper";
import {
  PROVENANCE_SECTION_GRAPH_LABEL,
  PROVENANCE_SECTION_LINKAGE_POINTS_LABEL,
  PROVENANCE_SECTION_RELATIONSHIPS_LABEL,
} from "@/lib/provenance-evidence-copy";
import {
  provenanceEdgeDisplayLabel,
  provenanceNodeDisplayName,
  provenanceNodeTypeLabel,
} from "@/lib/provenance-node-presentation";

import type { ProvenancePageWorkspaceProps } from "./provenance-page-workspace-types";
import { FILTER_OPTIONS, SEARCH_THRESHOLD, useProvenancePageWorkspace } from "./use-provenance-page-workspace";
import { ProvenanceNextReviewFooterClient } from "./ProvenanceNextReviewFooterClient";
import {
  resolveProvenanceInspectEmphasizedStepId,
  resolveProvenanceInspectSteps,
} from "@/lib/provenance-inspect-checklist";

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
    inspectComplete: selectedNodeId.trim().length > 0,
  });
  const provenanceInspectEmphasizedStepId = resolveProvenanceInspectEmphasizedStepId({
    reviewPicked: hasScopedRun,
    provenanceLoaded: graph.nodes.length > 0,
    inspectComplete: selectedNodeId.trim().length > 0,
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
                    <aside
                      className="mt-4 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
                      aria-label="Selected node details"
                      data-testid="provenance-node-detail"
                    >
                      <h4 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{provenanceNodeDisplayName(selectedNode)}</h4>
                      <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                        {provenanceNodeTypeLabel(selectedNode.type)}
                      </p>
                      <dl className={cn("mt-3 space-y-2", OPERATOR_TYPOGRAPHY.body)}>
                        <div>
                          <dt className="font-semibold">Reference</dt>
                          <dd className="mt-0.5">
                            <ProvenanceReferenceLink runId={runId} referenceId={selectedNode.referenceId} nodes={graph.nodes} />
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Incoming</dt>
                          <dd className="mt-0.5">
                            {incomingEdges.length === 0 ? (
                              <span className="text-neutral-500">None</span>
                            ) : (
                              <ul className="m-0 list-disc pl-5">
                                {incomingEdges.map((edge) => (
                                  <li key={edge.id}>
                                    <button
                                      type="button"
                                      className="text-left underline decoration-neutral-400 underline-offset-2"
                                      onClick={() => onSelectEdge(edge.id)}
                                    >
                                      {buyerTrailEdgeDisplayPhrase(edge.type)} from{" "}
                                      {provenanceNodeDisplayName(
                                        nodeById.get(edge.fromNodeId) ?? {
                                          id: edge.fromNodeId,
                                          type: "unknown",
                                          referenceId: edge.fromNodeId,
                                          name: edge.fromNodeId,
                                        },
                                      )}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Outgoing</dt>
                          <dd className="mt-0.5">
                            {outgoingEdges.length === 0 ? (
                              <span className="text-neutral-500">None</span>
                            ) : (
                              <ul className="m-0 list-disc pl-5">
                                {outgoingEdges.map((edge) => (
                                  <li key={edge.id}>
                                    <button
                                      type="button"
                                      className="text-left underline decoration-neutral-400 underline-offset-2"
                                      onClick={() => onSelectEdge(edge.id)}
                                    >
                                      {buyerTrailEdgeDisplayPhrase(edge.type)} to{" "}
                                      {provenanceNodeDisplayName(
                                        nodeById.get(edge.toNodeId) ?? {
                                          id: edge.toNodeId,
                                          type: "unknown",
                                          referenceId: edge.toNodeId,
                                          name: edge.toNodeId,
                                        },
                                      )}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </dd>
                        </div>
                      </dl>
                      <div className="mt-3">
                        <ProvenanceNodeExplainCell runId={runId} nodeId={selectedNode.id} />
                      </div>
                    </aside>
                  ) : null}
                </section>
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
                <section className="scroll-mt-28" {...provenanceViewPanelProps("table", true)}>
                  <h3 id="prov-nodes-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                    {PROVENANCE_SECTION_LINKAGE_POINTS_LABEL}
                  </h3>
                  {graph.nodes.length >= SEARCH_THRESHOLD ? (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-neutral-400" aria-hidden="true" />
                        <Input
                          value={nodeSearch}
                          onChange={(event) => setNodeSearch(event.target.value)}
                          placeholder="Search nodes"
                          className="pl-8"
                          aria-label="Search nodes"
                        />
                      </div>
                      <label className="flex items-center gap-2">
                        <span className={cn("sr-only", OPERATOR_TYPOGRAPHY.helper)}>Filter by type</span>
                        <select
                          className="h-9 rounded-md border border-neutral-200 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                          value={nodeTypeFilter}
                          onChange={(event) => setNodeTypeFilter(event.target.value)}
                          aria-label="Filter nodes by type"
                        >
                          <option value="">All types</option>
                          {nodeTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : null}
                  <div className="mt-3">
                    <EnterpriseTable
                      ariaLabel={PROVENANCE_SECTION_LINKAGE_POINTS_LABEL}
                      className={OPERATOR_TYPOGRAPHY.body}
                      data-testid="provenance-nodes-table"
                    >
                      <caption className="sr-only">{PROVENANCE_SECTION_LINKAGE_POINTS_LABEL}</caption>
                      <EnterpriseTableHead>
                        <EnterpriseTableHeadRow className="border-b-2 border-neutral-300 dark:border-neutral-600">
                          <EnterpriseTableHeaderCell scope="col" className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50">
                            Name
                          </EnterpriseTableHeaderCell>
                          <EnterpriseTableHeaderCell scope="col" className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50">
                            Type
                          </EnterpriseTableHeaderCell>
                          <EnterpriseTableHeaderCell scope="col" className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50">
                            Reference
                          </EnterpriseTableHeaderCell>
                          <EnterpriseTableHeaderCell scope="col" className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50">
                            <span className="sr-only">Explain</span>
                          </EnterpriseTableHeaderCell>
                        </EnterpriseTableHeadRow>
                      </EnterpriseTableHead>
                      <EnterpriseTableBody>
                        {filteredNodesForTable.length === 0 ? (
                          <EnterpriseTableRow>
                            <EnterpriseTableCell
                              colSpan={4}
                              className="border-b border-neutral-100 p-3 text-neutral-500 dark:border-neutral-800 dark:text-neutral-400"
                            >
                              {graph.nodes.length === 0
                                ? "No linkage points recorded for this review."
                                : "No linkage points match your search or type filter."}
                            </EnterpriseTableCell>
                          </EnterpriseTableRow>
                        ) : (
                          filteredNodesForTable.map((node) => {
                            const selected = selectedNodeId === node.id;

                            return (
                              <EnterpriseTableRow
                                key={node.id}
                                id={`prov-node-row-${node.id}`}
                                className={cn(
                                  "transition-colors",
                                  selected ? "bg-[color-mix(in_srgb,var(--al-accent-interactive)_12%,transparent)]" : "",
                                )}
                              >
                                <EnterpriseTableCell className="border-b border-neutral-100 p-3 align-top font-medium dark:border-neutral-800">
                                  <button
                                    type="button"
                                    className="text-left font-medium text-neutral-900 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:text-neutral-100"
                                    onClick={() => onSelectNode(node.id)}
                                  >
                                    {provenanceNodeDisplayName(node)}
                                  </button>
                                </EnterpriseTableCell>
                                <EnterpriseTableCell className="border-b border-neutral-100 p-3 align-top dark:border-neutral-800">
                                  {provenanceNodeTypeLabel(node.type)}
                                </EnterpriseTableCell>
                                <EnterpriseTableCell className="break-all border-b border-neutral-100 p-3 align-top dark:border-neutral-800">
                                  <ProvenanceReferenceLink runId={runId} referenceId={node.referenceId} nodes={graph.nodes} />
                                </EnterpriseTableCell>
                                <EnterpriseTableCell className="border-b border-neutral-100 p-3 align-top dark:border-neutral-800">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    aria-label={`Explain ${provenanceNodeDisplayName(node)}`}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onSelectNode(node.id);
                                    }}
                                  >
                                    <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                                  </Button>
                                </EnterpriseTableCell>
                              </EnterpriseTableRow>
                            );
                          })
                        )}
                      </EnterpriseTableBody>
                    </EnterpriseTable>
                  </div>
                </section>
              ) : null}

              {showTables ? (
                <section id="prov-edges" aria-labelledby="prov-edges-heading" className="scroll-mt-28">
                  <div className="flex items-center justify-between gap-2">
                    <h3 id="prov-edges-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                      {PROVENANCE_SECTION_RELATIONSHIPS_LABEL}
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      aria-expanded={edgesExpanded}
                      onClick={() => setEdgesExpanded((value) => !value)}
                    >
                      {edgesExpanded ? "Collapse" : "Expand"}
                    </Button>
                  </div>
                  {edgesExpanded ? (
                    <>
                      {graph.edges.length >= SEARCH_THRESHOLD ? (
                        <div className="relative mt-3 max-w-md">
                          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-neutral-400" aria-hidden="true" />
                          <Input
                            value={edgeSearch}
                            onChange={(event) => setEdgeSearch(event.target.value)}
                            placeholder="Search edges"
                            className="pl-8"
                            aria-label="Search edges"
                          />
                        </div>
                      ) : null}
                      <div className="mt-3">
                        <EnterpriseTable
                          ariaLabel={PROVENANCE_SECTION_RELATIONSHIPS_LABEL}
                          className={OPERATOR_TYPOGRAPHY.body}
                          data-testid="provenance-edges-table"
                        >
                          <caption className="sr-only">{PROVENANCE_SECTION_RELATIONSHIPS_LABEL}</caption>
                          <EnterpriseTableHead>
                            <EnterpriseTableHeadRow className="border-b-2 border-neutral-300 dark:border-neutral-600">
                              <EnterpriseTableHeaderCell scope="col" className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50">
                                Relationship
                              </EnterpriseTableHeaderCell>
                              <EnterpriseTableHeaderCell scope="col" className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50">
                                Type
                              </EnterpriseTableHeaderCell>
                            </EnterpriseTableHeadRow>
                          </EnterpriseTableHead>
                          <EnterpriseTableBody>
                            {filteredEdgesForTable.length === 0 ? (
                              <EnterpriseTableRow>
                                <EnterpriseTableCell
                                  colSpan={2}
                                  className="border-b border-neutral-100 p-3 text-neutral-500 dark:border-neutral-800 dark:text-neutral-400"
                                >
                                  {graph.edges.length === 0
                                    ? "No relationships recorded for this review."
                                    : "No relationships match your search."}
                                </EnterpriseTableCell>
                              </EnterpriseTableRow>
                            ) : (
                              filteredEdgesForTable.map((edge) => {
                                const highlighted = highlightedEdgeId === edge.id;

                                return (
                                  <EnterpriseTableRow
                                    key={edge.id}
                                    className={cn(
                                      "cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/40",
                                      highlighted
                                        ? "bg-[color-mix(in_srgb,var(--al-accent-interactive)_12%,transparent)]"
                                        : "",
                                    )}
                                    onClick={() => onSelectEdge(edge.id)}
                                  >
                                    <EnterpriseTableCell className="border-b border-neutral-100 p-3 align-top dark:border-neutral-800">
                                      {provenanceEdgeDisplayLabel(edge, nodeById)}
                                    </EnterpriseTableCell>
                                    <EnterpriseTableCell className="border-b border-neutral-100 p-3 align-top text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
                                      {buyerTrailEdgeDisplayPhrase(edge.type)}
                                    </EnterpriseTableCell>
                                  </EnterpriseTableRow>
                                );
                              })
                            )}
                          </EnterpriseTableBody>
                        </EnterpriseTable>
                      </div>
                    </>
                  ) : (
                    <p className={cn("mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                      {graph.edges.length} relationships recorded. Expand to inspect edge types and endpoints.
                    </p>
                  )}
                </section>
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
