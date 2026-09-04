"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { ProvenanceSection } from "@/components/provenance/ProvenanceSectionNav";
import type { ProvenanceViewMode } from "@/components/provenance/ProvenanceViewModeSwitcher";
import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import {
  parseProvenanceCategoryFromSearch,
  parseProvenanceViewModeFromSearch,
  parseProvenanceTableSearchQueryFromSearch,
  parseProvenanceTableNodeTypeFromSearch,
  parseProvenanceTableEdgeSearchQueryFromSearch,
  provenanceCategoryHrefFromSearch,
  provenanceViewModeHrefFromSearch,
  provenanceTableSearchHrefFromSearch,
  provenanceTableNodeTypeHrefFromSearch,
  provenanceTableEdgeSearchHrefFromSearch,
} from "@/lib/provenance/provenance-workspace-filters-url";
import {
  parseProvenanceSelectedNodeIdFromSearch,
  provenanceSelectedNodeHrefFromSearch,
} from "@/lib/provenance/provenance-selected-node-url";
import {
  parseProvenanceEdgeFocusFromSearch,
  parseProvenanceEdgesExpandedFromSearch,
  provenanceEdgeFocusHrefFromSearch,
} from "@/lib/provenance/provenance-edge-focus-url";
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
  { id: "governance", label: "Approval" },
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
  const router = useRouter();
  const pathname = usePathname() ?? reviewDetailPath(runId);
  const searchParams = useSearchParams();
  const urlViewMode = parseProvenanceViewModeFromSearch(searchParams.get("view"));
  const urlCategory = parseProvenanceCategoryFromSearch(searchParams.get("category"));
  const urlNodeSearch = parseProvenanceTableSearchQueryFromSearch(searchParams.get("q"));
  const urlNodeTypeFilter = parseProvenanceTableNodeTypeFromSearch(searchParams.get("nodeType"));
  const urlEdgeSearch = parseProvenanceTableEdgeSearchQueryFromSearch(searchParams.get("edgeQ"));
  const urlSelectedNodeId = parseProvenanceSelectedNodeIdFromSearch(searchParams.get("provNodeId"));
  const urlHighlightedEdgeId = parseProvenanceEdgeFocusFromSearch(searchParams.get("provEdgeId"));
  const urlEdgesExpanded = parseProvenanceEdgesExpandedFromSearch(searchParams.get("edgesExpanded"));
  // OpenAPI may omit optional arrays; normalize before .length / .map so SSR/demo payloads cannot crash.
  const graph: ArchitectureRunProvenanceGraph = {
    ...props.graph,
    nodes: props.graph.nodes ?? [],
    edges: props.graph.edges ?? [],
    timeline: props.graph.timeline ?? [],
    traceabilityGaps: props.graph.traceabilityGaps ?? [],
  };
  const [viewMode, setViewModeState] = useState<ProvenanceViewMode>(urlViewMode);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedEdgeId, setHighlightedEdgeId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<ProvenanceNodeFilterCategory>>(
    () => (urlCategory === null ? new Set() : new Set([urlCategory])),
  );
  const [layoutSeed, setLayoutSeed] = useState(0);
  const [edgesExpanded, setEdgesExpandedState] = useState(
    () => urlEdgesExpanded || graph.edges.length < SEARCH_THRESHOLD,
  );
  const [nodeSearch, setNodeSearch] = useState(urlNodeSearch);
  const [nodeTypeFilter, setNodeTypeFilter] = useState(urlNodeTypeFilter);
  const [edgeSearch, setEdgeSearch] = useState(urlEdgeSearch);

  const nodeById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes]);

  const syncProvenanceEdgeToUrl = useCallback(
    (edgeId: string | null, expanded: boolean) => {
      router.replace(
        provenanceEdgeFocusHrefFromSearch(
          searchParams.toString(),
          { edgeId, edgesExpanded: expanded },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setEdgesExpanded = useCallback(
    (value: boolean) => {
      setEdgesExpandedState(value);
      syncProvenanceEdgeToUrl(highlightedEdgeId, value);
    },
    [highlightedEdgeId, syncProvenanceEdgeToUrl],
  );

  useEffect(() => {
    setEdgesExpandedState(urlEdgesExpanded || graph.edges.length < SEARCH_THRESHOLD);
  }, [graph.edges.length, urlEdgesExpanded]);

  useEffect(() => {
    if (urlHighlightedEdgeId.length === 0) {
      return;
    }

    const edge = graph.edges.find((item) => item.id === urlHighlightedEdgeId);

    if (edge === undefined) {
      return;
    }

    setHighlightedEdgeId(urlHighlightedEdgeId);
    setSelectedNodeId(edge.fromNodeId);
  }, [graph.edges, urlHighlightedEdgeId]);

  useEffect(() => {
    setViewModeState(urlViewMode);
  }, [urlViewMode]);

  useEffect(() => {
    setActiveFilters(urlCategory === null ? new Set() : new Set([urlCategory]));
  }, [urlCategory]);

  useEffect(() => {
    setNodeSearch(urlNodeSearch);
  }, [urlNodeSearch]);

  useEffect(() => {
    setNodeTypeFilter(urlNodeTypeFilter);
  }, [urlNodeTypeFilter]);

  useEffect(() => {
    setEdgeSearch(urlEdgeSearch);
  }, [urlEdgeSearch]);

  useEffect(() => {
    if (urlSelectedNodeId.length === 0) {
      return;
    }

    if (!nodeById.has(urlSelectedNodeId)) {
      return;
    }

    setSelectedNodeId(urlSelectedNodeId);
    setHighlightedEdgeId(null);
  }, [nodeById, urlSelectedNodeId]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextHref = provenanceTableSearchHrefFromSearch(searchParams.toString(), nodeSearch, pathname);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [nodeSearch, pathname, router, searchParams]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextHref = provenanceTableEdgeSearchHrefFromSearch(searchParams.toString(), edgeSearch, pathname);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [edgeSearch, pathname, router, searchParams]);

  const setNodeTypeFilterWithUrl = useCallback((value: string): void => {
    setNodeTypeFilter(value);
    router.replace(provenanceTableNodeTypeHrefFromSearch(searchParams.toString(), value, pathname), { scroll: false });
  }, [pathname, router, searchParams]);

  const setViewMode = useCallback((mode: ProvenanceViewMode): void => {
    setViewModeState(mode);
    router.replace(provenanceViewModeHrefFromSearch(searchParams.toString(), mode, pathname), { scroll: false });
  }, [pathname, router, searchParams]);

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
    router.replace(
      provenanceSelectedNodeHrefFromSearch(searchParams.toString(), nodeId, pathname),
      { scroll: false },
    );
    syncProvenanceEdgeToUrl(null, edgesExpanded);

    if (nodeId !== null) {
      flashNodeRow(nodeId);
    }
  }, [edgesExpanded, pathname, router, searchParams, syncProvenanceEdgeToUrl]);

  const onSelectEdge = useCallback((edgeId: string) => {
    setHighlightedEdgeId(edgeId);
    const edge = graph.edges.find((item) => item.id === edgeId);

    if (edge !== undefined) {
      setSelectedNodeId(edge.fromNodeId);
      router.replace(
        provenanceSelectedNodeHrefFromSearch(searchParams.toString(), edge.fromNodeId, pathname),
        { scroll: false },
      );
    }

    syncProvenanceEdgeToUrl(edgeId, edgesExpanded);
  }, [edgesExpanded, graph.edges, pathname, router, searchParams, syncProvenanceEdgeToUrl]);

  const toggleFilter = useCallback((filter: ProvenanceNodeFilterCategory) => {
    const count = filterCounts.get(filter) ?? 0;

    if (count === 0) {
      return;
    }

    const nextCategory = activeFilters.has(filter) ? null : filter;

    setActiveFilters(nextCategory === null ? new Set() : new Set([nextCategory]));
    setLayoutSeed((value) => value + 1);
    router.replace(provenanceCategoryHrefFromSearch(searchParams.toString(), nextCategory, pathname), { scroll: false });
  }, [activeFilters, filterCounts, pathname, router, searchParams]);

  const graphVisibleNodeCount = useMemo(() => {
    return graph.nodes.filter((node) => provenanceNodeMatchesFilter(node, activeFilters)).length;
  }, [activeFilters, graph.nodes]);

  const onGraphRenderFailed = useCallback(() => {
    setViewMode("table");
  }, [setViewMode]);

  const openTablesView = useCallback(() => {
    setViewMode("table");
  }, [setViewMode]);

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
        router.replace(
          provenanceSelectedNodeHrefFromSearch(searchParams.toString(), null, pathname),
          { scroll: false },
        );
        syncProvenanceEdgeToUrl(null, edgesExpanded);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [edgesExpanded, pathname, router, searchParams, syncProvenanceEdgeToUrl]);

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
    pathname,
    currentSearch: searchParams.toString(),
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
    setNodeTypeFilter: setNodeTypeFilterWithUrl,
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
