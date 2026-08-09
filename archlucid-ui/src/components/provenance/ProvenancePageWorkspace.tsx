"use client";

import { cn } from "@/lib/utils";
import { MessageSquareText, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ProvenanceGraphViewport } from "@/components/provenance/ProvenanceGraphViewport";
import { ProvenanceGraphErrorBoundary } from "@/components/provenance/ProvenanceGraphErrorBoundary";
import { ProvenanceSectionNav, type ProvenanceSection } from "@/components/provenance/ProvenanceSectionNav";
import { ProvenanceNodeExplainCell } from "@/components/ProvenanceNodeExplainCell";
import { ProvenanceReferenceLink } from "@/components/ProvenanceReferenceLink";
import { RunTraceViewerLink } from "@/components/RunTraceViewerLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  provenanceEdgeDisplayLabel,
  provenanceNodeDisplayName,
  provenanceNodeMatchesFilter,
  provenanceNodeTypeLabel,
  type ProvenanceNodeFilterCategory,
} from "@/lib/provenance-node-presentation";
import {
  provenanceTimelinePrimaryLabel,
  provenanceTimelineTechnicalKind,
} from "@/lib/provenance-timeline-presentation";
import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";

export type ProvenancePageWorkspaceProps = {
  readonly runId: string;
  readonly graph: ArchitectureRunProvenanceGraph;
  readonly provenanceTraceId: string | null;
};

type ProvenanceViewMode = "graph" | "timeline" | "table";

const FILTER_OPTIONS: ReadonlyArray<{ id: ProvenanceNodeFilterCategory; label: string }> = [
  { id: "evidence", label: "Evidence" },
  { id: "findings", label: "Findings" },
  { id: "controls", label: "Controls" },
  { id: "decisions", label: "Decisions" },
  { id: "governance", label: "Governance" },
  { id: "artifacts", label: "Artifacts" },
];

const SEARCH_THRESHOLD = 8;

function formatUtc(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}

function flashNodeRow(nodeId: string): void {
  const element = document.getElementById(`prov-node-row-${nodeId}`);

  if (element === null) {
    return;
  }

  element.scrollIntoView({ behavior: "smooth", block: "center" });
  element.classList.add("prov-node-row--flash");
  window.setTimeout(() => element.classList.remove("prov-node-row--flash"), 1600);
}

export function ProvenancePageWorkspace(props: ProvenancePageWorkspaceProps): React.JSX.Element {
  const { runId, provenanceTraceId } = props;
  // OpenAPI may omit optional arrays; normalize before .length / .map so SSR/demo payloads cannot crash.
  const graph: ArchitectureRunProvenanceGraph = {
    ...props.graph,
    nodes: props.graph.nodes ?? [],
    edges: props.graph.edges ?? [],
    timeline: props.graph.timeline ?? [],
    traceabilityGaps: props.graph.traceabilityGaps ?? [],
  };
  const [viewMode, setViewMode] = useState<ProvenanceViewMode>("graph");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedEdgeId, setHighlightedEdgeId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<ProvenanceNodeFilterCategory>>(new Set());
  const [layoutSeed, setLayoutSeed] = useState(0);
  const [edgesExpanded, setEdgesExpanded] = useState(false);
  const [nodeSearch, setNodeSearch] = useState("");
  const [nodeTypeFilter, setNodeTypeFilter] = useState("");
  const [edgeSearch, setEdgeSearch] = useState("");

  const nodeById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes]);

  const sections = useMemo((): ProvenanceSection[] => {
    return [
      ...(graph.traceabilityGaps.length > 0 ? [{ id: "trace-gaps", label: "Traceability gaps" }] : []),
      { id: "prov-graph", label: "Provenance graph" },
      { id: "prov-timeline", label: "Trace timeline" },
      { id: "prov-nodes", label: "Nodes" },
      { id: "prov-edges", label: "Edges" },
    ];
  }, [graph.traceabilityGaps.length]);

  const selectedNode = selectedNodeId === null ? null : (nodeById.get(selectedNodeId) ?? null);

  const incomingEdges = useMemo(() => {
    if (selectedNodeId === null) {
      return [];
    }

    return graph.edges.filter((edge) => edge.toNodeId === selectedNodeId);
  }, [graph.edges, selectedNodeId]);

  const outgoingEdges = useMemo(() => {
    if (selectedNodeId === null) {
      return [];
    }

    return graph.edges.filter((edge) => edge.fromNodeId === selectedNodeId);
  }, [graph.edges, selectedNodeId]);

  const filteredNodesForTable = useMemo(() => {
    const query = nodeSearch.trim().toLowerCase();
    const typeQuery = nodeTypeFilter.trim().toLowerCase();

    return graph.nodes.filter((node) => {
      if (!provenanceNodeMatchesFilter(node, activeFilters)) {
        return false;
      }

      if (typeQuery.length > 0 && !provenanceNodeTypeLabel(node.type).toLowerCase().includes(typeQuery)) {
        return false;
      }

      if (query.length === 0) {
        return true;
      }

      const haystack = `${provenanceNodeDisplayName(node)} ${node.referenceId} ${node.type}`.toLowerCase();

      return haystack.includes(query);
    });
  }, [activeFilters, graph.nodes, nodeSearch, nodeTypeFilter]);

  const filteredEdgesForTable = useMemo(() => {
    const query = edgeSearch.trim().toLowerCase();

    if (query.length === 0) {
      return graph.edges;
    }

    return graph.edges.filter((edge) => {
      const label = provenanceEdgeDisplayLabel(edge, nodeById).toLowerCase();

      return label.includes(query) || edge.type.toLowerCase().includes(query);
    });
  }, [edgeSearch, graph.edges, nodeById]);

  const nodeTypes = useMemo(() => {
    const types = new Set(graph.nodes.map((node) => provenanceNodeTypeLabel(node.type)));

    return [...types].sort((a, b) => a.localeCompare(b));
  }, [graph.nodes]);

  const onSelectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    setHighlightedEdgeId(null);

    if (nodeId !== null) {
      flashNodeRow(nodeId);
    }
  }, []);

  const onSelectEdge = useCallback((edgeId: string) => {
    setHighlightedEdgeId(edgeId);
    const edge = graph.edges.find((item) => item.id === edgeId);

    if (edge !== undefined) {
      setSelectedNodeId(edge.fromNodeId);
    }
  }, [graph.edges]);

  const toggleFilter = useCallback((filter: ProvenanceNodeFilterCategory) => {
    setActiveFilters((current) => {
      const next = new Set(current);

      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }

      return next;
    });
    setLayoutSeed((value) => value + 1);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setSelectedNodeId(null);
        setHighlightedEdgeId(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const showGraph = viewMode === "graph" || viewMode === "table";
  const showTimeline = viewMode === "timeline" || viewMode === "table";
  const showTables = viewMode === "table" || viewMode === "graph";

  return (
    <div className="w-full max-w-[1160px] p-4 print:w-full" data-testid="provenance-page-workspace">
      <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:gap-10">
        <article className="min-w-0 flex-1 space-y-6 text-neutral-800 dark:text-neutral-200">
          <ProvenanceSectionNav sections={sections} placement="inline-top" />

          <header className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>Provenance</h2>
              <PageContextualHelpButton />
            </div>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              Review{" "}
              <code className={cn("rounded bg-neutral-100 px-1 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.micro)}>
                {graph.runId}
              </code>{" "}
              — {graph.nodes.length} nodes, {graph.edges.length} edges, {graph.timeline.length} timeline events.
            </p>
            <RunTraceViewerLink traceId={provenanceTraceId} />
          </header>
{graph.traceabilityGaps.length > 0 ? (
            <section
              id="trace-gaps"
              aria-labelledby="trace-gaps-heading"
              className={cn(
                "rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50",
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              <h3 id="trace-gaps-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                Traceability gaps
              </h3>
              <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
                {graph.traceabilityGaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="inline-flex rounded-md border border-neutral-200 p-0.5 dark:border-neutral-700" role="tablist" aria-label="Provenance view">
              {(["graph", "timeline", "table"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={viewMode === mode}
                  className={cn(
                    "rounded px-3 py-1.5 text-sm capitalize",
                    viewMode === mode
                      ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                      : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
                  )}
                  onClick={() => setViewMode(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5" data-testid="provenance-graph-filters">
              {FILTER_OPTIONS.map((option) => {
                const active = activeFilters.has(option.id);

                return (
                  <Button
                    key={option.id}
                    type="button"
                    size="sm"
                    variant={active ? "default" : "outline"}
                    className="h-8"
                    aria-pressed={active}
                    onClick={() => toggleFilter(option.id)}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {activeFilters.size > 0 ? (
            <p className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.micro)} role="status">
              Filters hide graph elements for focus only — all provenance data remains available in the tables below.
            </p>
          ) : null}

          {showGraph ? (
            <section id="prov-graph" aria-labelledby="prov-graph-heading" className="scroll-mt-28">
              <h3 id="prov-graph-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                Provenance graph
              </h3>
              <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                Explore how evidence, findings, decisions, governance records, and artifacts connect across this review.
              </p>
              <div className="mt-3 w-full min-w-0">
                <ProvenanceGraphErrorBoundary
                  key={layoutSeed}
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
                      onRetryRender={() => setLayoutSeed((value) => value + 1)}
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
                                  {edge.type} from{" "}
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
                                  {edge.type} to{" "}
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
            <section id="prov-timeline" aria-labelledby="prov-timeline-heading" className="scroll-mt-28">
              <h3 id="prov-timeline-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                Trace timeline
              </h3>
              <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                Ordered events from review lifecycle and finalized decisions.
              </p>
              <div className="overflow-x-auto">
                <table className={cn("w-full border-collapse", OPERATOR_TYPOGRAPHY.body)} data-testid="provenance-timeline-table">
                  <thead>
                    <tr className="border-b-2 border-neutral-300 dark:border-neutral-600">
                      <th className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50">Time (UTC)</th>
                      <th className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50">Event</th>
                      <th className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {graph.timeline.map((row) => {
                      const relatedNode = graph.nodes.find((node) => node.referenceId === row.referenceId);

                      return (
                        <tr
                          key={`${row.timestampUtc}-${row.kind}-${row.referenceId ?? row.label}`}
                          className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/40"
                          onClick={() => {
                            if (relatedNode !== undefined) {
                              onSelectNode(relatedNode.id);
                            }
                          }}
                        >
                          <td className="border-b border-neutral-100 p-3 align-top whitespace-nowrap dark:border-neutral-800">
                            <time dateTime={row.timestampUtc}>{formatUtc(row.timestampUtc)}</time>
                          </td>
                          <td className="border-b border-neutral-100 p-3 align-top dark:border-neutral-800">
                            <span className="font-medium text-neutral-900 dark:text-neutral-100">
                              {provenanceTimelinePrimaryLabel(row)}
                            </span>
                            <span
                              className={cn("mt-0.5 block text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}
                              title={provenanceTimelineTechnicalKind(row)}
                            >
                              {provenanceTimelineTechnicalKind(row)}
                            </span>
                          </td>
                          <td className="break-all border-b border-neutral-100 p-3 align-top dark:border-neutral-800">
                            <ProvenanceReferenceLink runId={runId} referenceId={row.referenceId} nodes={graph.nodes} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {showTables ? (
            <section id="prov-nodes" aria-labelledby="prov-nodes-heading" className="scroll-mt-28">
              <h3 id="prov-nodes-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                Nodes
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
              <div className="mt-3 overflow-x-auto">
                <table className={cn("w-full border-collapse", OPERATOR_TYPOGRAPHY.body)} data-testid="provenance-nodes-table">
                  <thead>
                    <tr className="border-b-2 border-neutral-300 dark:border-neutral-600">
                      <th className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50">Name</th>
                      <th className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50">Type</th>
                      <th className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50">Reference</th>
                      <th className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50">
                        <span className="sr-only">Explain</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNodesForTable.map((node) => {
                      const selected = selectedNodeId === node.id;

                      return (
                        <tr
                          key={node.id}
                          id={`prov-node-row-${node.id}`}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/40",
                            selected ? "bg-blue-50/70 dark:bg-blue-950/30" : "",
                          )}
                          onClick={() => onSelectNode(node.id)}
                        >
                          <td className="border-b border-neutral-100 p-3 align-top font-medium dark:border-neutral-800">
                            {provenanceNodeDisplayName(node)}
                          </td>
                          <td className="border-b border-neutral-100 p-3 align-top dark:border-neutral-800">
                            {provenanceNodeTypeLabel(node.type)}
                          </td>
                          <td className="break-all border-b border-neutral-100 p-3 align-top dark:border-neutral-800">
                            <code className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
                              <ProvenanceReferenceLink runId={runId} referenceId={node.referenceId} nodes={graph.nodes} />
                            </code>
                          </td>
                          <td className="border-b border-neutral-100 p-3 align-top dark:border-neutral-800">
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {showTables ? (
            <section id="prov-edges" aria-labelledby="prov-edges-heading" className="scroll-mt-28">
              <div className="flex items-center justify-between gap-2">
                <h3 id="prov-edges-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  Edges
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
                  <div className="mt-3 overflow-x-auto">
                    <table className={cn("w-full border-collapse", OPERATOR_TYPOGRAPHY.body)} data-testid="provenance-edges-table">
                      <thead>
                        <tr className="border-b-2 border-neutral-300 dark:border-neutral-600">
                          <th className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50">Relationship</th>
                          <th className="bg-neutral-50/90 p-3 text-left font-semibold dark:bg-neutral-900/50">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEdgesForTable.map((edge) => {
                          const highlighted = highlightedEdgeId === edge.id;

                          return (
                            <tr
                              key={edge.id}
                              className={cn(
                                "cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/40",
                                highlighted ? "bg-blue-50/70 dark:bg-blue-950/30" : "",
                              )}
                              onClick={() => onSelectEdge(edge.id)}
                            >
                              <td className="border-b border-neutral-100 p-3 align-top dark:border-neutral-800">
                                {provenanceEdgeDisplayLabel(edge, nodeById)}
                              </td>
                              <td className="border-b border-neutral-100 p-3 align-top text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
                                {edge.type}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className={cn("mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {graph.edges.length} relationships recorded. Expand to inspect edge types and endpoints.
                </p>
              )}
            </section>
          ) : null}
        </article>

        <ProvenanceSectionNav sections={sections} placement="sidebar" />
      </div>

      <style>{`
        .prov-node-row--flash {
          outline: 2px solid #3b82f6;
          background: #eff6ff;
          transition: background 0.3s ease;
        }
      `}</style>
    </div>
  );
}
