"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { ProvenanceSection } from "@/components/provenance/ProvenanceSectionNav";
import type { ProvenanceViewMode } from "@/components/provenance/ProvenanceViewModeSwitcher";
import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import {
  PROVENANCE_SECTION_GRAPH_LABEL,
  PROVENANCE_SECTION_LINKAGE_POINTS_LABEL,
  PROVENANCE_SECTION_RELATIONSHIPS_LABEL,
  PROVENANCE_SECTION_TRACE_TIMELINE_LABEL,
} from "@/lib/provenance-evidence-copy";
import {
  provenanceEdgeDisplayLabel,
  provenanceNodeDisplayName,
  provenanceNodeFilterCategory,
  provenanceNodeMatchesFilter,
  provenanceNodeTypeLabel,
  type ProvenanceNodeFilterCategory,
} from "@/lib/provenance-node-presentation";
import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";

import type { ProvenancePageWorkspaceProps } from "./provenance-page-workspace-types";

export const FILTER_OPTIONS: ReadonlyArray<{ id: ProvenanceNodeFilterCategory; label: string }> = [
  { id: "evidence", label: "Evidence" },
  { id: "findings", label: "Findings" },
  { id: "controls", label: "Controls" },
  { id: "decisions", label: "Decisions" },
  { id: "governance", label: "Governance" },
  { id: "artifacts", label: "Artifacts" },
];

export const SEARCH_THRESHOLD = 8;

function flashNodeRow(nodeId: string): void {
  const element = document.getElementById(`prov-node-row-${nodeId}`);

  if (element === null) {
    return;
  }

  element.scrollIntoView({ behavior: "smooth", block: "center" });
  element.classList.add("prov-node-row--flash");
  window.setTimeout(() => element.classList.remove("prov-node-row--flash"), 1600);
}

export function useProvenancePageWorkspace(props: ProvenancePageWorkspaceProps) {
  const { runId, provenanceTraceId, reviewContext, dataOrigin = "live" } = props;
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
  const [edgesExpanded, setEdgesExpanded] = useState(() => graph.edges.length < SEARCH_THRESHOLD);
  const [nodeSearch, setNodeSearch] = useState("");
  const [nodeTypeFilter, setNodeTypeFilter] = useState("");
  const [edgeSearch, setEdgeSearch] = useState("");

  const nodeById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes]);

  const sections = useMemo((): ProvenanceSection[] => {
    const next: ProvenanceSection[] = [];

    if (graph.traceabilityGaps.length > 0) {
      next.push({ id: "trace-gaps", label: "Traceability gaps" });
    }

    if (viewMode === "graph") {
      next.push({ id: "prov-graph", label: PROVENANCE_SECTION_GRAPH_LABEL });
    }

    if (viewMode === "timeline") {
      next.push({ id: "prov-timeline", label: PROVENANCE_SECTION_TRACE_TIMELINE_LABEL });
    }

    if (viewMode === "table") {
      next.push({ id: "prov-timeline", label: PROVENANCE_SECTION_TRACE_TIMELINE_LABEL });
      next.push({ id: "prov-nodes", label: PROVENANCE_SECTION_LINKAGE_POINTS_LABEL });
      next.push({ id: "prov-edges", label: PROVENANCE_SECTION_RELATIONSHIPS_LABEL });
    }

    return next;
  }, [graph.traceabilityGaps.length, viewMode]);

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

  const filterCounts = useMemo(() => {
    const counts = new Map<ProvenanceNodeFilterCategory, number>(
      FILTER_OPTIONS.map((option) => [option.id, 0]),
    );

    for (const node of graph.nodes) {
      const category = provenanceNodeFilterCategory(node.type);

      if (category === null) {
        continue;
      }

      counts.set(category, (counts.get(category) ?? 0) + 1);
    }

    return counts;
  }, [graph.nodes]);

  const filteredNodesForTable = useMemo(() => {
    const query = nodeSearch.trim().toLowerCase();
    const typeQuery = nodeTypeFilter.trim().toLowerCase();

    return graph.nodes.filter((node) => {
      if (typeQuery.length > 0 && !provenanceNodeTypeLabel(node.type).toLowerCase().includes(typeQuery)) {
        return false;
      }

      if (query.length === 0) {
        return true;
      }

      const haystack = `${provenanceNodeDisplayName(node)} ${node.referenceId} ${node.type}`.toLowerCase();

      return haystack.includes(query);
    });
  }, [graph.nodes, nodeSearch, nodeTypeFilter]);

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
    const count = filterCounts.get(filter) ?? 0;

    if (count === 0) {
      return;
    }

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
  }, [filterCounts]);

  const graphVisibleNodeCount = useMemo(() => {
    return graph.nodes.filter((node) => provenanceNodeMatchesFilter(node, activeFilters)).length;
  }, [activeFilters, graph.nodes]);

  const onGraphRenderFailed = useCallback(() => {
    setViewMode("table");
  }, []);

  const openTablesView = useCallback(() => {
    setViewMode("table");
  }, []);

  const retryGraphLayout = useCallback(() => {
    setLayoutSeed((value) => value + 1);
  }, []);

  const reviewTitle = reviewContext?.reviewTitle?.trim() ?? "";
  const reviewHref = reviewDetailPath(runId);

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

  const showGraph = viewMode === "graph";
  const showTimeline = viewMode === "timeline" || viewMode === "table";
  const showTables = viewMode === "table";
  const evidenceGraphHref =
    runId.trim().length > 0
      ? `/insights/evidence-graph?runId=${encodeURIComponent(runId.trim())}`
      : "/insights/evidence-graph";

  return {
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
  };
}
