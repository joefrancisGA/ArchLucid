"use client";

import { cn } from "@/lib/utils";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import type { GraphEdgeVm, GraphNodeVm, GraphViewModel } from "@/types/graph";
import {
  graphLooksLikeCoordinatorProvenanceTrail,
  isBuyerTrailPhiHeroNode,
  mapGraphToReactFlow,
  type MapGraphPresentation,
} from "@/lib/graph-mapper";
import { graphViewModelFilteredByNodeType } from "@/lib/graph-view-model-type-filter";
import { OperatorEmptyState } from "@/components/operator/OperatorShellMessage";
import { useBasicAdvancedToggle } from "@/hooks/useBasicAdvancedToggle";
import { GraphBuyerCanvasToolbar } from "@/components/GraphBuyerCanvasToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { BUYER_VIEW_SIGNED_RECORD_CTA } from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { fetchProvenanceNodeExplanationViaProxy } from "@/lib/fetch-provenance-node-explanation";
import {
  findingIdForGraphDeepLink,
  graphFindingDetailHref,
} from "@/lib/graph-finding-deep-links";
import { getShowcaseManifestHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import {
  graphBuyerTrailDispositionLine,
  graphBuyerTrailMetadataLines,
  graphBuyerTrailPanelTitle,
  graphBuyerTrailRecordTypeLine,
} from "@/lib/graph-buyer-node-detail";
import {
  filterGraphViewModelToNodeIds,
  resolveBuyerTrailPathBreadcrumb,
  resolveBuyerTrailPathNodeIds,
} from "@/lib/graph-buyer-path-filter";
import { applyGraphSelectionFocus } from "@/lib/graph-selection-highlight";
import { useInpOffloadTask } from "@/lib/workers/inp-offload-client";
import {
  BUYER_EVIDENCE_GRAPH_OPEN_DECISION_RECORD_CTA,
  BUYER_EVIDENCE_GRAPH_OPEN_FINDING_DETAIL_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import {
  OPERATOR_CALLOUT_WARN_CLASS,
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_LINK,
  OPERATOR_NAV_GROUP_LABEL,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { ReasoningTraceReadMore } from "@/components/ReasoningTraceReadMore";
import { GraphNodeKindLegendChips } from "@/components/GraphNodeKindLegendChips";
import Link from "next/link";

function pickHeroNodeId(graph: GraphViewModel, preferredId: string | undefined): GraphNodeVm | null {
  const trimmed = preferredId?.trim() ?? "";

  if (trimmed.length > 0) {
    const match = graph.nodes.find((n) => n.id === trimmed);

    if (match !== undefined) {
      return match;
    }
  }

  const phiHero = graph.nodes.find((n) => isBuyerTrailPhiHeroNode(n));

  if (phiHero !== undefined) {
    return phiHero;
  }

  const finding = graph.nodes.find((n) => n.type === "Finding");

  if (finding !== undefined) {
    return finding;
  }

  const manifest = graph.nodes.find((n) => n.type === "GoldenManifest");

  if (manifest !== undefined) {
    return manifest;
  }

  return graph.nodes[0] ?? null;
}

function GraphBuyerZoom100Trigger({
  trigger,
}: {
  trigger: number;
}) {
  const { getViewport, setViewport } = useReactFlow();

  useEffect(() => {
    if (trigger === 0) {
      return;
    }

    const current = getViewport();
    void setViewport({ x: current.x, y: current.y, zoom: 1 }, { duration: 200 });
  }, [getViewport, setViewport, trigger]);

  return null;
}

function GraphBuyerFitViewTrigger({
  fitPadding,
  fitMaxZoom,
  trigger,
}: {
  fitPadding: number;
  fitMaxZoom: number;
  trigger: number;
}) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (trigger === 0) {
      return;
    }

    void fitView({ padding: fitPadding, maxZoom: fitMaxZoom, duration: 260 });
  }, [fitMaxZoom, fitPadding, fitView, trigger]);

  return null;
}

/**
 * Re-runs fitView after node/edge or presentation changes so buyer and operator
 * graphs stay framed when data loads or filters update (fitView on ReactFlow
 * only applies on first mount).
 */
function GraphFitViewSync({
  nodeCount,
  edgeCount,
  presentationKey,
  padding,
  maxZoom,
}: {
  nodeCount: number;
  edgeCount: number;
  presentationKey: string;
  padding: number;
  maxZoom: number;
}) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (nodeCount === 0) {
      return;
    }

    let canceled = false;
    const outer = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!canceled) {
          void fitView({ padding, maxZoom, duration: 260 });
        }
      });
    });

    return () => {
      canceled = true;
      window.cancelAnimationFrame(outer);
    };
  }, [nodeCount, edgeCount, presentationKey, padding, maxZoom, fitView]);

  return null;
}

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
  const [showPathOnly, setShowPathOnly] = useState(false);
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
  };

  const handleTogglePathOnly = (): void => {
    if (showPathOnly) {
      setShowPathOnly(false);
      setPathNodeIds(null);
      setFitViewTrigger((current) => current + 1);

      return;
    }

    handleTracePath();
  };

  const handleResetView = (): void => {
    setShowPathOnly(false);
    setPathNodeIds(null);
    setFitViewTrigger((current) => current + 1);
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
              onTogglePathOnly={handleTogglePathOnly}
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
              }
            }}
            onNodeClick={(_, node) => {
              setSelectedEdge(null);
              setExplainStatusLine("");
              setExplainAggregateHref(null);
              setSelectedNode((node.data.raw as GraphNodeVm) ?? null);
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
        {interactiveSurfaceReady ? (
          <div
            className={cn(
              "rounded-md border border-slate-200 bg-slate-50/90 p-3 dark:border-slate-700 dark:bg-slate-900/40",
              OPERATOR_TYPOGRAPHY.body,
            )}
            data-testid="graph-canvas-legend"
          >
            <GraphNodeKindLegendChips />
          </div>
        ) : null}
        {!buyerTrailPanel && !compactChrome ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="m-0">Graph Settings</h3>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant={isAdvanced ? "outline" : "default"}
                  size="sm"
                  className={cn("h-7 px-2", OPERATOR_TYPOGRAPHY.button)}
                  onClick={() => {
                    if (isAdvanced) toggle();
                  }}
                >
                  Basic
                </Button>
                <Button
                  type="button"
                  variant={isAdvanced ? "default" : "outline"}
                  size="sm"
                  className={cn("h-7 px-2", OPERATOR_TYPOGRAPHY.button)}
                  onClick={() => {
                    if (!isAdvanced) toggle();
                  }}
                >
                  Advanced
                </Button>
              </div>
            </div>

            {isAdvanced ? (
              <div className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
                <Label htmlFor="edge-inference-threshold" className={OPERATOR_TYPOGRAPHY.helper}>
                  Edge Inference Threshold
                </Label>
                <Input
                  id="edge-inference-threshold"
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={edgeInferenceThreshold}
                  onChange={(e) => setEdgeInferenceThreshold(e.target.value)}
                  className={cn("h-8", OPERATOR_TYPOGRAPHY.body)}
                />
                <p className={cn("text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
                  Minimum confidence score required to render inferred edges between nodes.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

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
            <div className="space-y-3">
              <h3 className="mt-0">Edge detail</h3>
              {!buyerTrailPanel ? (
                <>
                  {selectedEdge.id !== undefined &&
                  selectedEdge.id !== null &&
                  String(selectedEdge.id).trim().length > 0 ? (
                    <p className="m-0">
                      <strong>ID:</strong> {String(selectedEdge.id)}
                    </p>
                  ) : null}
                  <p className="m-0">
                    <strong>From:</strong> {selectedEdge.source}
                  </p>
                  <p className="m-0">
                    <strong>To:</strong> {selectedEdge.target}
                  </p>
                  <p className="m-0">
                    <strong>Relationship:</strong> {selectedEdge.type}
                  </p>
                  {selectedEdge.label !== undefined &&
                  selectedEdge.label !== null &&
                  String(selectedEdge.label).trim().length > 0 ? (
                    <p className="m-0">
                      <strong>Label:</strong> {String(selectedEdge.label)}
                    </p>
                  ) : null}
                  {selectedEdge.inferenceSource !== undefined &&
                  selectedEdge.inferenceSource !== null &&
                  selectedEdge.inferenceSource.trim().length > 0 ? (
                    <p className="m-0">
                      <strong>Inference rule:</strong> {selectedEdge.inferenceSource.trim()}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className={cn("text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
                  <strong>Edge:</strong> {selectedEdge.source} → {selectedEdge.target} ({selectedEdge.type})
                </p>
              )}
              {selectedEdge.reasoningTrace !== undefined &&
              selectedEdge.reasoningTrace !== null &&
              selectedEdge.reasoningTrace.trim().length > 0 ? (
                <div className="border-t border-neutral-200 pt-3 dark:border-neutral-700">
                  <ReasoningTraceReadMore heading="Reasoning trace" trace={selectedEdge.reasoningTrace} />
                </div>
              ) : (
                !buyerTrailPanel && (
                  <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    No reasoning narration was persisted for this edge.
                  </p>
                )
              )}
            </div>
          ) : null}

          {selectedNode ? (
            <>
              {buyerTrailPanel ? (
                <div className="space-y-3">
                  {selectionBreadcrumb.length > 0 ? (
                    <p
                      className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
                      data-testid="graph-selection-breadcrumb"
                      aria-label="Path context for selected node"
                    >
                      {selectionBreadcrumb.join(" → ")}
                    </p>
                  ) : null}
                  <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                    {graphBuyerTrailPanelTitle(selectedNode)}
                  </h3>
                  {(() => {
                    const recordType = graphBuyerTrailRecordTypeLine(selectedNode);

                    return recordType.secondary !== null ? (
                      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                        {recordType.secondary}
                      </p>
                    ) : null;
                  })()}
                </div>
              ) : (
                <>
                  <h3 className="mt-0">Node detail</h3>
                  <p>
                    <strong>ID:</strong> {selectedNode.id}
                  </p>
                  <p>
                    <strong>Label:</strong> {selectedNode.label}
                  </p>
                </>
              )}

              {!buyerTrailPanel ? (
                <p>
                  <strong>Type:</strong> {selectedNode.type}
                </p>
              ) : null}

              {buyerTrailPanel
                ? (() => {
                    const dispositionLine = graphBuyerTrailDispositionLine(
                      selectedNode.type,
                      selectedNode.metadata,
                    );

                    if (dispositionLine === null) {
                      return null;
                    }

                    return (
                      <p className={cn("m-0 mt-2 rounded-md border leading-snug", OPERATOR_CALLOUT_WARN_CLASS, OPERATOR_TYPOGRAPHY.body)}>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">Decision:</span>{" "}
                        {dispositionLine}
                      </p>
                    );
                  })()
                : null}

              {buyerTrailPanel && runId.trim().length > 0 && selectedNode.type === "GoldenManifest" ? (
                <div className="mt-3 flex flex-col gap-2">
                  <Button type="button" variant="default" size="sm" className="h-9 w-full justify-center" asChild>
                    <Link href={signedRecordDetailPath(selectedNode.id.trim())}>
                      Open signed review record
                    </Link>
                  </Button>
                </div>
              ) : null}

              {buyerTrailPanel && runId.trim().length > 0 && selectedNode.type === "Decision" ? (
                <div className="mt-3 flex flex-col gap-2">
                  <Button type="button" variant="outline" size="sm" className="h-9 w-full justify-center" asChild>
                    <Link
                      href={`/architecture/reviews/${encodeURIComponent(canonicalizeDemoRunId(runId.trim()))}#run-explanation`}
                    >
                      {BUYER_EVIDENCE_GRAPH_OPEN_DECISION_RECORD_CTA}
                    </Link>
                  </Button>
                </div>
              ) : null}

              {buyerTrailPanel && runId.trim().length > 0 && selectedNode.type === "Finding" ? (
                <div className="mt-3 flex flex-col gap-2">
                  {(() => {
                    const fid = findingIdForGraphDeepLink(selectedNode);

                    if (fid === null) {
                      return (
                        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                          Finding-level pages need a persisted finding reference on this node.
                        </p>
                      );
                    }

                    const rid = canonicalizeDemoRunId(runId.trim());

                    return (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Button type="button" variant="default" size="sm" className="h-9 w-full justify-center" asChild>
                          <Link href={getShowcaseManifestHref()}>{BUYER_VIEW_SIGNED_RECORD_CTA}</Link>
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="h-9 w-full justify-center" asChild>
                          <Link href={graphFindingDetailHref(rid, fid)}>{BUYER_EVIDENCE_GRAPH_OPEN_FINDING_DETAIL_CTA}</Link>
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              ) : null}

              {!buyerTrailPanel ? (
                <>
                  <h4>Metadata</h4>
                  {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 ? (
                    <ul>
                      {Object.entries(selectedNode.metadata).map(([key, value]) => (
                        <li key={key}>
                          <strong>{key}:</strong> {String(value)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No metadata available.</p>
                  )}
                </>
              ) : selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 ? (
                (() => {
                  const { summaryLines, technicalLines } = graphBuyerTrailMetadataLines(selectedNode.metadata);

                  return (
                    <>
                      {summaryLines.length > 0 ? (
                        <div className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 p-3">
                          <p className={cn("m-0 font-semibold text-teal-700 dark:text-teal-400", OPERATOR_NAV_GROUP_LABEL)}>
                            At a glance
                          </p>
                          <dl className="m-0 mt-2 grid gap-y-1.5">
                            {summaryLines.map((row) => (
                              <div key={`${row.label}-${row.value}`} className="flex gap-x-2">
                                <dt className={cn("shrink-0 font-semibold text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                                  {row.label}
                                </dt>
                                <dd className={cn("m-0 min-w-0 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
                                  {row.value}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      ) : null}
                      {technicalLines.length > 0 ? (
                        <details className="mt-2 rounded-md border border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/50">
                          <summary className={cn(
                            "cursor-pointer select-none px-3 py-2 font-semibold text-neutral-800 dark:text-neutral-200",
                            OPERATOR_DISCLOSURE_TRIGGER_CLASS,
                          )}>
                            Technical appendix
                          </summary>
                          <ul className={cn("m-0 list-none space-y-1 px-3 pb-3 pt-0", OPERATOR_TYPOGRAPHY.helper)}>
                            {technicalLines.map((row) => (
                              <li key={`${row.label}-${row.value}`}>
                                <span className="font-medium text-neutral-700 dark:text-neutral-300">{row.label}:</span>{" "}
                                <span className="break-all text-neutral-600 dark:text-neutral-400">{row.value}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : null}
                    </>
                  );
                })()
              ) : null}

              {selectedNode.reasoningTrace !== undefined &&
              selectedNode.reasoningTrace !== null &&
              selectedNode.reasoningTrace.trim().length > 0 ? (
                <div className="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-700">
                  <ReasoningTraceReadMore heading="Reasoning trace" trace={selectedNode.reasoningTrace} />
                </div>
              ) : null}

              {runId.trim().length > 0 && selectedNode !== null && !buyerTrailPanel && !compactChrome ? (
                <div className="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-700">
                  <h4 className="mt-0">Explain this node</h4>
                  <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    Per-node summaries are not supported. The API returns guidance and a link to the run-level aggregate
                    explanation (Standard tier).
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={async () => {
                      const result = await fetchProvenanceNodeExplanationViaProxy(runId.trim(), selectedNode.id);
                      setExplainStatusLine(result.message);
                      setExplainAggregateHref(result.aggregateProxyHref);
                    }}
                  >
                    Request explanation
                  </Button>
                  {explainStatusLine ? (
                    <p className={cn("mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} aria-live="polite">
                      {explainStatusLine}
                    </p>
                  ) : null}
                  {explainAggregateHref ? (
                    <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                      <a
                        className={OPERATOR_LINK.nav}
                        href={explainAggregateHref}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open review-level summary
                      </a>
                    </p>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
