"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import type { GraphEdgeVm, GraphNodeVm, GraphViewModel } from "@/types/graph";
import {
  graphLooksLikeCoordinatorProvenanceTrail,
  mapGraphToReactFlow,
  type MapGraphPresentation,
} from "@/lib/graph-mapper";
import { graphViewModelFilteredByNodeType } from "@/lib/graph-view-model-type-filter";
import { OperatorEmptyState } from "@/components/operator/OperatorShellMessage";
import { useBasicAdvancedToggle } from "@/hooks/useBasicAdvancedToggle";
import { GraphBuyerCanvasToolbar } from "@/components/GraphBuyerCanvasToolbar";
import { GraphViewerSelectionAside } from "@/components/GraphViewerSelectionAside";
import {
  GraphBuyerFitViewTrigger,
  GraphBuyerZoom100Trigger,
  GraphFitViewSync,
  pickHeroNodeId,
} from "@/components/GraphViewerReactFlowTriggers";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  filterGraphViewModelToNodeIds,
  resolveBuyerTrailPathBreadcrumb,
  resolveBuyerTrailPathNodeIds,
} from "@/lib/graph-buyer-path-filter";
import { applyGraphSelectionFocus } from "@/lib/graph-selection-highlight";
import { parseGraphPathOnlyFromSearch, graphPathOnlyHrefFromSearch } from "@/lib/insights/graph-path-only-url";
import { graphNodeFocusHrefFromSearch } from "@/lib/insights/graph-node-focus-url";
import {
  graphEdgeFocusHrefFromSearch,
  parseGraphEdgeFocusFromSearch,
} from "@/lib/insights/graph-edge-focus-url";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { useInpOffloadTask } from "@/lib/workers/inp-offload-client";

/**
 * Interactive graph viewer wrapping React Flow. Supports node type filtering
 * and a side panel for inspecting the selected node's metadata.
 */
export function GraphViewer({
  graph,
  typeFilter = "",
  runId = "",
  presentation = "operator",
  defaultSelectedNodeId,
  onInteractiveSurfaceReady,
  compactChrome = false,
}: {
  graph: GraphViewModel;
  typeFilter?: string;
  /** When set, enables the reserved explanation fetch for the selected graph node id. */
  runId?: string;
  presentation?: MapGraphPresentation;
  /** When presentation is buyerTrail, pre-select this node id when present on the graph. */
  defaultSelectedNodeId?: string;
  /** Fires once the React Flow canvas has initialized (used to avoid “nodes in view” copy before pixels exist). */
  onInteractiveSurfaceReady?: () => void;
  /**
   * When true, hides graph settings/advanced controls, disables drag/connect authoring affordances,
   * and uses a shorter canvas — for embedded run-detail architecture previews.
   */
  compactChrome?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? EVIDENCE_GRAPH_PATH;
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const urlPathOnly = parseGraphPathOnlyFromSearch(searchParams.get("pathOnly"));
  const urlGraphEdgeId = parseGraphEdgeFocusFromSearch(searchParams.get("graphEdgeId"));

  const syncGraphSelectionToUrl = (graphNodeId: string | null, graphEdgeId: string | null): void => {
    const afterNode = graphNodeFocusHrefFromSearch(currentSearch, graphNodeId, pathname);
    const nextSearch = afterNode.includes("?") ? afterNode.slice(afterNode.indexOf("?") + 1) : "";
    router.replace(graphEdgeFocusHrefFromSearch(nextSearch, graphEdgeId, pathname), { scroll: false });
  };

  const deferredTypeFilter = useDeferredValue(typeFilter);
  const filtered = useMemo(
    () => graphViewModelFilteredByNodeType(graph, deferredTypeFilter),
    [graph, deferredTypeFilter],
  );

  const forceBuyerTrailForFinding =
    presentation === "buyerTrail" &&
    isBuyerPolishedOperatorShellEnv() &&
    filtered.nodes.some((n) => n.type === "Finding");

  const flowPresentation: MapGraphPresentation =
    presentation === "buyerTrail" &&
    (graphLooksLikeCoordinatorProvenanceTrail(filtered) || forceBuyerTrailForFinding)
      ? "buyerTrail"
      : "operator";

  const [selectedNode, setSelectedNode] = useState<GraphNodeVm | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdgeVm | null>(null);
  const [explainStatusLine, setExplainStatusLine] = useState("");
  const [explainAggregateHref, setExplainAggregateHref] = useState<string | null>(null);

  const { isAdvanced, toggle } = useBasicAdvancedToggle("archlucid_graph_settings_advanced_toggle");
  const [edgeInferenceThreshold, setEdgeInferenceThreshold] = useState("0.75");
  const [showPathOnly, setShowPathOnly] = useState(urlPathOnly);
  const [pathNodeIds, setPathNodeIds] = useState<Set<string> | null>(null);
  const [fitViewTrigger, setFitViewTrigger] = useState(0);
  const [zoom100Trigger, setZoom100Trigger] = useState(0);

  const pathScopedGraph = useMemo(() => {
    if (!showPathOnly || pathNodeIds === null || pathNodeIds.size === 0) {
      return filtered;
    }

    return filterGraphViewModelToNodeIds(filtered, pathNodeIds);
  }, [filtered, pathNodeIds, showPathOnly]);

  const mapPayload = useMemo(
    () => ({
      graph: pathScopedGraph,
      presentation: flowPresentation,
    }),
    [flowPresentation, pathScopedGraph],
  );

  const mapKey = `${flowPresentation}:${pathScopedGraph.nodeCount}:${pathScopedGraph.edgeCount}:${selectedNode?.id ?? ""}`;
  const { result: mappedResult } = useInpOffloadTask("graphReactFlowMap", mapPayload, mapKey);

  const { nodes, edges } = useMemo(() => {
    const mapped = mappedResult ?? mapGraphToReactFlow(pathScopedGraph, flowPresentation);

    return applyGraphSelectionFocus(mapped.nodes, mapped.edges, selectedNode?.id);
  }, [flowPresentation, mappedResult, pathScopedGraph, selectedNode?.id]);

  const buyerTrailPanel = flowPresentation === "buyerTrail";
  const [interactiveSurfaceReady, setInteractiveSurfaceReady] = useState(false);

  const fitPadding = buyerTrailPanel ? 0.005 : 0.08;
  const fitMaxZoom = buyerTrailPanel ? 6.2 : 1.52;
  const hasSelection = selectedNode !== null;

  const handleTracePath = (): void => {
    if (selectedNode === null) {
      return;
    }

    const nextPath = resolveBuyerTrailPathNodeIds(filtered, selectedNode.id);

    if (nextPath === null) {
      return;
    }

    setPathNodeIds(nextPath);
    setShowPathOnly(true);
    setFitViewTrigger((current) => current + 1);
    router.replace(graphPathOnlyHrefFromSearch(currentSearch, true), { scroll: false });
  };

  useEffect(() => {
    setShowPathOnly(urlPathOnly);
  }, [urlPathOnly]);

  useEffect(() => {
    if (urlGraphEdgeId.length === 0) {
      return;
    }

    const edge = filtered.edges.find((item) => item.id === urlGraphEdgeId);

    if (edge === undefined) {
      return;
    }

    setSelectedEdge(edge);
    setSelectedNode(null);
  }, [filtered.edges, urlGraphEdgeId]);

  useEffect(() => {
    if (!urlPathOnly || selectedNode === null) {
      if (!urlPathOnly) {
        setPathNodeIds(null);
      }

      return;
    }

    const nextPath = resolveBuyerTrailPathNodeIds(filtered, selectedNode.id);

    if (nextPath !== null) {
      setPathNodeIds(nextPath);
    }
  }, [filtered, selectedNode, urlPathOnly]);

  const handleResetView = (): void => {
    setShowPathOnly(false);
    setPathNodeIds(null);
    setFitViewTrigger((current) => current + 1);
    router.replace(graphPathOnlyHrefFromSearch(currentSearch, false), { scroll: false });
  };

  const selectionBreadcrumb =
    buyerTrailPanel && selectedNode !== null
      ? resolveBuyerTrailPathBreadcrumb(filtered, selectedNode.id)
      : [];

  useEffect(() => {
    setInteractiveSurfaceReady(false);
  }, [filtered.nodes.length, filtered.edges.length, flowPresentation]);

  useEffect(() => {
    if (filtered.nodes.length === 0) {
      return;
    }

    let canceled = false;

    const outer = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!canceled) {
          setInteractiveSurfaceReady(true);
          onInteractiveSurfaceReady?.();
        }
      });
    });

    return () => {
      canceled = true;
      window.cancelAnimationFrame(outer);
    };
  }, [filtered.nodes.length, filtered.edges.length, flowPresentation, onInteractiveSurfaceReady]);

  useEffect(() => {
    if (!buyerTrailPanel) {
      return;
    }

    const hero = pickHeroNodeId(filtered, defaultSelectedNodeId);
    setSelectedNode(hero);
    setSelectedEdge(null);
    setExplainStatusLine("");
    setExplainAggregateHref(null);
  }, [buyerTrailPanel, filtered, defaultSelectedNodeId]);

  if (filtered.nodes.length === 0) {
    if (typeFilter) {
      return (
        <OperatorEmptyState title="No nodes match this filter">
          <p className="m-0">
            No nodes match type &quot;{typeFilter}&quot;. Clear the type filter or reload the graph with different scope.
          </p>
        </OperatorEmptyState>
      );
    }

    return (
      <OperatorEmptyState title="No graph data to display">
        <p className="m-0">This review has no graph nodes to display yet.</p>
      </OperatorEmptyState>
    );
  }

  return (
    <div
      className={
        buyerTrailPanel
          ? "grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,28%)]"
          : compactChrome
            ? "grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]"
            : "grid grid-cols-[1fr_320px] gap-4"
      }
      data-testid={buyerTrailPanel ? "graph-buyer-workspace" : "graph-operator-workspace"}
    >
      <div
        className={
          buyerTrailPanel
            ? "h-[min(88vh,960px)] min-h-[520px] w-full rounded-xl border-2 border-slate-200 bg-slate-50/80 shadow-inner dark:border-slate-700 dark:bg-slate-950/50"
            : compactChrome
              ? "h-[min(55vh,520px)] min-h-[300px] w-full border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950"
              : "h-[70vh] w-full border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950"
        }
      >
        {buyerTrailPanel ? (
          <div className="border-b border-slate-200 px-3 py-2 dark:border-slate-700">
            <GraphBuyerCanvasToolbar
              onFitGraph={() => setFitViewTrigger((current) => current + 1)}
              onZoom100={() => setZoom100Trigger((current) => current + 1)}
              onResetView={handleResetView}
              onTracePath={handleTracePath}
              showPathOnly={showPathOnly}
              hasSelection={hasSelection}
            />
          </div>
        ) : null}
        <div className={buyerTrailPanel ? "h-[calc(100%-3.25rem)] min-h-[460px]" : "h-full"}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes as Node[]}
            edges={edges as Edge[]}
            fitView
            fitViewOptions={{ padding: fitPadding, maxZoom: fitMaxZoom }}
            minZoom={buyerTrailPanel ? 0.22 : 0.2}
            maxZoom={buyerTrailPanel ? 2.35 : 1.72}
            onlyRenderVisibleElements
            nodesDraggable={!compactChrome}
            nodesConnectable={!compactChrome}
            proOptions={{ hideAttribution: true }}
            onEdgeClick={(event, rfEdge) => {
              event.stopPropagation();

              const rawCandidate = rfEdge?.data?.raw;

              const rawEdge = typeof rawCandidate === "object" && rawCandidate !== null ? (rawCandidate as GraphEdgeVm) : null;

              if (rawEdge !== null) {
                setSelectedEdge(rawEdge);
                setSelectedNode(null);
                setExplainStatusLine("");
                setExplainAggregateHref(null);
                syncGraphSelectionToUrl(null, rawEdge.id ?? null);
              }
            }}
            onNodeClick={(_, node) => {
              setSelectedEdge(null);
              setExplainStatusLine("");
              setExplainAggregateHref(null);
              const nextNode = (node.data.raw as GraphNodeVm) ?? null;
              setSelectedNode(nextNode);
              syncGraphSelectionToUrl(nextNode?.id ?? null, null);
            }}
          >
            <GraphFitViewSync
              nodeCount={nodes.length}
              edgeCount={edges.length}
              presentationKey={flowPresentation}
              padding={fitPadding}
              maxZoom={fitMaxZoom}
            />
            <GraphBuyerFitViewTrigger
              fitPadding={fitPadding}
              fitMaxZoom={fitMaxZoom}
              trigger={fitViewTrigger}
            />
            <GraphBuyerZoom100Trigger trigger={zoom100Trigger} />
            {buyerTrailPanel ? null : compactChrome ? null : <MiniMap />}

            <Controls
              showInteractive={!buyerTrailPanel && !compactChrome}
              className={buyerTrailPanel ? "shadow-md" : undefined}
            />

            <Background
              id="archlucid-graph-bg"
              variant={buyerTrailPanel ? BackgroundVariant.Dots : BackgroundVariant.Lines}
              gap={buyerTrailPanel ? 20 : 15}
              size={buyerTrailPanel ? 1 : 1}
              className={buyerTrailPanel ? "opacity-40" : undefined}
            />
          </ReactFlow>
        </ReactFlowProvider>
        </div>
      </div>

      <GraphViewerSelectionAside
        buyerTrailPanel={buyerTrailPanel}
        compactChrome={compactChrome}
        interactiveSurfaceReady={interactiveSurfaceReady}
        isAdvanced={isAdvanced}
        onToggleAdvanced={toggle}
        edgeInferenceThreshold={edgeInferenceThreshold}
        onEdgeInferenceThresholdChange={setEdgeInferenceThreshold}
        selectedEdge={selectedEdge}
        selectedNode={selectedNode}
        selectionBreadcrumb={selectionBreadcrumb}
        runId={runId}
        explainStatusLine={explainStatusLine}
        onExplainStatusLineChange={setExplainStatusLine}
        explainAggregateHref={explainAggregateHref}
        onExplainAggregateHrefChange={setExplainAggregateHref}
      />
    </div>
  );
}
