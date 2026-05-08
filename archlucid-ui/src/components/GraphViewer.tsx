"use client";

import { useEffect, useMemo, useState } from "react";
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
import type { GraphNodeVm, GraphViewModel } from "@/types/graph";
import {
  graphLooksLikeCoordinatorProvenanceTrail,
  mapGraphToReactFlow,
  type MapGraphPresentation,
} from "@/lib/graph-mapper";
import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import { useBasicAdvancedToggle } from "@/hooks/useBasicAdvancedToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchProvenanceNodeExplanationViaProxy } from "@/lib/fetch-provenance-node-explanation";
import { graphBuyerTrailMetadataLines } from "@/lib/graph-buyer-node-detail";

/** Filters a graph to only include nodes of the given type and edges between those nodes. */
function filterGraphByType(graph: GraphViewModel, typeFilter: string): GraphViewModel {
  if (!typeFilter) return graph;

  const nodes = graph.nodes.filter((n) => n.type === typeFilter);
  const ids = new Set(nodes.map((n) => n.id));
  const edges = graph.edges.filter((e) => ids.has(e.source) && ids.has(e.target));

  return { nodes, edges };
}

function pickHeroNodeId(graph: GraphViewModel, preferredId: string | undefined): GraphNodeVm | null {
  const trimmed = preferredId?.trim() ?? "";

  if (trimmed.length > 0) {
    const match = graph.nodes.find((n) => n.id === trimmed);

    if (match !== undefined) {
      return match;
    }
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
 * Interactive graph viewer wrapping React Flow. Supports node type filtering
 * and a side panel for inspecting the selected node's metadata.
 */
export function GraphViewer({
  graph,
  typeFilter = "",
  runId = "",
  presentation = "operator",
  defaultSelectedNodeId,
}: {
  graph: GraphViewModel;
  typeFilter?: string;
  /** When set, enables the reserved explanation fetch for the selected graph node id. */
  runId?: string;
  presentation?: MapGraphPresentation;
  /** When presentation is buyerTrail, pre-select this node id when present on the graph. */
  defaultSelectedNodeId?: string;
}) {
  const filtered = useMemo(() => filterGraphByType(graph, typeFilter), [graph, typeFilter]);

  const flowPresentation: MapGraphPresentation =
    presentation === "buyerTrail" && graphLooksLikeCoordinatorProvenanceTrail(filtered)
      ? "buyerTrail"
      : "operator";

  const { nodes, edges } = useMemo(
    () => mapGraphToReactFlow(filtered, flowPresentation),
    [filtered, flowPresentation],
  );

  const [selectedNode, setSelectedNode] = useState<GraphNodeVm | null>(null);
  const [explainStatusLine, setExplainStatusLine] = useState("");
  const [explainAggregateHref, setExplainAggregateHref] = useState<string | null>(null);

  const { isAdvanced, toggle } = useBasicAdvancedToggle("archlucid_graph_settings_advanced_toggle");
  const [edgeInferenceThreshold, setEdgeInferenceThreshold] = useState("0.75");

  const buyerTrailPanel = flowPresentation === "buyerTrail";

  useEffect(() => {
    if (!buyerTrailPanel) {
      return;
    }

    const hero = pickHeroNodeId(filtered, defaultSelectedNodeId);
    setSelectedNode(hero);
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
    <div className={buyerTrailPanel ? "grid grid-cols-[1fr_minmax(280px,340px)] gap-4" : "grid grid-cols-[1fr_320px] gap-4"}>
      <div
        className={
          buyerTrailPanel
            ? "h-[min(85vh,880px)] min-h-[480px] w-full rounded-xl border-2 border-slate-200 bg-slate-50/80 shadow-inner dark:border-slate-700 dark:bg-slate-950/50"
            : "h-[70vh] w-full border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950"
        }
      >
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes as Node[]}
            edges={edges as Edge[]}
            fitView
            fitViewOptions={{ padding: buyerTrailPanel ? 0.14 : 0.1, maxZoom: buyerTrailPanel ? 1.52 : 1.35 }}
            minZoom={0.2}
            maxZoom={1.65}
            onlyRenderVisibleElements
            proOptions={{ hideAttribution: true }}
            onNodeClick={(_, node) => {
              setExplainStatusLine("");
              setExplainAggregateHref(null);
              setSelectedNode((node.data.raw as GraphNodeVm) ?? null);
            }}
          >
            {buyerTrailPanel ? null : <MiniMap />}

            <Controls showInteractive={!buyerTrailPanel} className={buyerTrailPanel ? "shadow-md" : undefined} />

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

      <aside className="max-h-[min(85vh,880px)] flex flex-col gap-4 overflow-auto rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950">
        {!buyerTrailPanel ? (
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
        ) : (
          <div className="rounded-md border border-slate-200 bg-slate-50/90 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/40">
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Legend</p>
            <p className="m-0 mt-1 leading-snug text-slate-800 dark:text-slate-200">
              Boxes follow the review from captured context through risks to the finalized package and deliverables.
            </p>
          </div>
        )}

        <div className="flex-1">
          <h3 className="mt-0">Node detail</h3>

          {!selectedNode && !buyerTrailPanel ? <p>Select a node to inspect it.</p> : null}

          {!selectedNode && buyerTrailPanel ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Select a node on the canvas to see details.</p>
          ) : null}

          {selectedNode ? (
            <>
              {!buyerTrailPanel ? (
                <p>
                  <strong>ID:</strong> {selectedNode.id}
                </p>
              ) : null}

              <p>
                <strong>{buyerTrailPanel ? "Step" : "Label"}:</strong> {selectedNode.label}
              </p>

              {!buyerTrailPanel ? (
                <p>
                  <strong>Type:</strong> {selectedNode.type}
                </p>
              ) : (
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">Record type:</span>{" "}
                  {selectedNode.type}
                </p>
              )}

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
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">At a glance</h4>
                          <ul className="m-0 list-none space-y-2 p-0 text-sm">
                            {summaryLines.map((row) => (
                              <li key={`${row.label}-${row.value}`}>
                                <span className="font-medium text-neutral-800 dark:text-neutral-200">{row.label}:</span>{" "}
                                <span className="text-neutral-700 dark:text-neutral-300">{row.value}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {technicalLines.length > 0 ? (
                        <details className="mt-2 rounded-md border border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/50">
                          <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                            Technical references
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

              {runId.trim().length > 0 && selectedNode !== null && !buyerTrailPanel ? (
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
