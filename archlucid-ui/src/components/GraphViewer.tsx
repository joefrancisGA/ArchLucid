"use client";

import { useEffect, useMemo, useState } from "react";
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
import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import { useBasicAdvancedToggle } from "@/hooks/useBasicAdvancedToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { fetchProvenanceNodeExplanationViaProxy } from "@/lib/fetch-provenance-node-explanation";
import {
  findingIdForGraphDeepLink,
  graphFindingDetailHref,
} from "@/lib/graph-finding-deep-links";
import { getShowcaseManifestHref } from "@/lib/buyer-safe-review-navigation";
import {
  graphBuyerTrailDispositionLine,
  graphBuyerTrailMetadataLines,
  graphBuyerTrailRecordTypeLine,
} from "@/lib/graph-buyer-node-detail";
import { ReasoningTraceReadMore } from "@/components/ReasoningTraceReadMore";
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

    let cancelled = false;
    const outer = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!cancelled) {
          void fitView({ padding, maxZoom, duration: 260 });
        }
      });
    });

    return () => {
      cancelled = true;
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
  const filtered = useMemo(() => graphViewModelFilteredByNodeType(graph, typeFilter), [graph, typeFilter]);

  const forceBuyerTrailForFinding =
    presentation === "buyerTrail" &&
    isBuyerPolishedOperatorShellEnv() &&
    filtered.nodes.some((n) => n.type === "Finding");

  const flowPresentation: MapGraphPresentation =
    presentation === "buyerTrail" &&
    (graphLooksLikeCoordinatorProvenanceTrail(filtered) || forceBuyerTrailForFinding)
      ? "buyerTrail"
      : "operator";

  const { nodes, edges } = useMemo(
    () => mapGraphToReactFlow(filtered, flowPresentation),
    [filtered, flowPresentation],
  );

  const [selectedNode, setSelectedNode] = useState<GraphNodeVm | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdgeVm | null>(null);
  const [explainStatusLine, setExplainStatusLine] = useState("");
  const [explainAggregateHref, setExplainAggregateHref] = useState<string | null>(null);

  const { isAdvanced, toggle } = useBasicAdvancedToggle("archlucid_graph_settings_advanced_toggle");
  const [edgeInferenceThreshold, setEdgeInferenceThreshold] = useState("0.75");

  const buyerTrailPanel = flowPresentation === "buyerTrail";

  const fitPadding = buyerTrailPanel ? 0.005 : 0.08;
  const fitMaxZoom = buyerTrailPanel ? 6.2 : 1.52;

  useEffect(() => {
    if (filtered.nodes.length === 0) {
      return;
    }

    if (onInteractiveSurfaceReady === undefined) {
      return;
    }

    let cancelled = false;

    const outer = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!cancelled) {
          onInteractiveSurfaceReady();
        }
      });
    });

    return () => {
      cancelled = true;
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
        <p className="m-0">The API returned a graph with no nodes (valid empty result, not a filter).</p>
      </OperatorEmptyState>
    );
  }

  return (
    <div
      className={
        buyerTrailPanel
          ? "grid grid-cols-[1fr_minmax(280px,340px)] gap-4"
          : compactChrome
            ? "grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]"
            : "grid grid-cols-[1fr_320px] gap-4"
      }
    >
      <div
        className={
          buyerTrailPanel
            ? "h-[min(76vh,820px)] min-h-[440px] w-full rounded-xl border-2 border-slate-200 bg-slate-50/80 shadow-inner dark:border-slate-700 dark:bg-slate-950/50"
            : compactChrome
              ? "h-[min(55vh,520px)] min-h-[300px] w-full border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950"
              : "h-[70vh] w-full border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950"
        }
      >
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

      <aside
        className={
          buyerTrailPanel
            ? "max-h-[min(88vh,960px)] flex flex-col gap-4 overflow-auto rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
            : compactChrome
              ? "max-h-[min(55vh,520px)] flex flex-col gap-4 overflow-auto rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950 lg:max-h-[min(55vh,520px)]"
              : "max-h-[70vh] flex flex-col gap-4 overflow-auto rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
        }
      >
        {buyerTrailPanel ? (
          <div className="rounded-md border border-slate-200 bg-slate-50/90 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/40">
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Legend</p>
            <p className="m-0 mt-1 leading-snug text-slate-800 dark:text-slate-200">
              Evidence-to-decision trail: each item in the graph represents source context, analysis, findings, decisions,
              or deliverable evidence; the highlighted finding anchors the signed manifest and deliverables bundle.
            </p>
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
                  className="h-7 px-2 text-xs"
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
                  className="h-7 px-2 text-xs"
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
                <Label htmlFor="edge-inference-threshold" className="text-xs">
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
                  className="h-8 text-sm"
                />
                <p className="text-[11px] text-neutral-500">
                  Minimum confidence score required to render inferred edges between nodes.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex-1">
          {!selectedEdge && !selectedNode && !buyerTrailPanel ? (
            <p>Select a node or inferred edge on the canvas to inspect reasoning and metadata.</p>
          ) : null}

          {!selectedEdge && !selectedNode && buyerTrailPanel ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
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
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
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
                  <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400">
                    No reasoning narration was persisted for this edge.
                  </p>
                )
              )}
            </div>
          ) : null}

          {selectedNode ? (
            <>
              {buyerTrailPanel ? (
                (() => {
                  const recordType = graphBuyerTrailRecordTypeLine(selectedNode);

                  return (
                    <div className="space-y-0.5">
                      <p className="m-0 text-base font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
                        {recordType.primary}
                      </p>
                      {recordType.secondary !== null ? (
                        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">{recordType.secondary}</p>
                      ) : null}
                    </div>
                  );
                })()
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
                      <p className="m-0 mt-2 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50 px-2.5 py-2 text-sm leading-snug">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">Decision:</span>{" "}
                        {dispositionLine}
                      </p>
                    );
                  })()
                : null}

              {buyerTrailPanel && runId.trim().length > 0 && selectedNode.type === "GoldenManifest" ? (
                <div className="mt-3 flex flex-col gap-2">
                  <Button type="button" variant="default" size="sm" className="h-9 w-full justify-center" asChild>
                    <Link href={`/manifests/${encodeURIComponent(selectedNode.id.trim())}`}>
                      Open signed manifest record
                    </Link>
                  </Button>
                </div>
              ) : null}

              {buyerTrailPanel && runId.trim().length > 0 && selectedNode.type === "Decision" ? (
                <div className="mt-3 flex flex-col gap-2">
                  <Button type="button" variant="outline" size="sm" className="h-9 w-full justify-center" asChild>
                    <Link
                      href={`/reviews/${encodeURIComponent(canonicalizeDemoRunId(runId.trim()))}#run-explanation`}
                    >
                      View recorded decisions on review
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
                        <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
                          Finding-level pages need a persisted finding reference on this node.
                        </p>
                      );
                    }

                    const rid = canonicalizeDemoRunId(runId.trim());

                    return (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Button type="button" variant="default" size="sm" className="h-9 w-full justify-center" asChild>
                          <Link href={getShowcaseManifestHref()}>View signed manifest</Link>
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="h-9 w-full justify-center" asChild>
                          <Link href={graphFindingDetailHref(rid, fid)}>View finding detail</Link>
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
                          <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                            At a glance
                          </p>
                          <dl className="m-0 mt-2 grid gap-y-1.5">
                            {summaryLines.map((row) => (
                              <div key={`${row.label}-${row.value}`} className="flex gap-x-2">
                                <dt className="shrink-0 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                                  {row.label}
                                </dt>
                                <dd className="m-0 min-w-0 text-xs text-neutral-800 dark:text-neutral-200">
                                  {row.value}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      ) : null}
                      {technicalLines.length > 0 ? (
                        <details className="mt-2 rounded-md border border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/50">
                          <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                            Technical appendix
                          </summary>
                          <ul className="m-0 list-none space-y-1 px-3 pb-3 pt-0 text-xs">
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
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
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
                    <p className="mt-2 text-[11px] text-neutral-600 dark:text-neutral-400" aria-live="polite">
                      {explainStatusLine}
                    </p>
                  ) : null}
                  {explainAggregateHref ? (
                    <p className="mt-1 text-[11px]">
                      <a
                        className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        href={explainAggregateHref}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open run-level summary
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
