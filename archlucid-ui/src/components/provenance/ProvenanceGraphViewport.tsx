"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import {
  computeProvenanceGraphLayout,
  PROVENANCE_LABEL_LINE_HEIGHT,
  type ProvenanceLayoutNode,
} from "@/lib/provenance-graph-layout";
import { useInpOffloadTask } from "@/lib/workers/inp-offload-client";
import {
  applyProvenanceZoomAtPoint,
  computeFitToViewTransform,
  PROVENANCE_GRAPH_MIN_HEIGHT_PX,
  PROVENANCE_GRAPH_MIN_LABEL_FONT_PX,
  PROVENANCE_GRAPH_ZOOM_STEP,
  provenancePanTransform,
  provenanceTransformToSvg,
  type ProvenanceViewportTransform,
} from "@/lib/provenance-graph-viewport";
import {
  provenanceLegendEntriesForNodes,
  type ProvenanceNodeFilterCategory,
  provenanceNodeMatchesFilter,
  provenanceNodeTypeLabel,
} from "@/lib/provenance-node-presentation";
import type { ArchitectureLinkageEdge, ArchitectureLinkageNode } from "@/types/architecture-provenance";

import { ProvenanceGraphLegend } from "./ProvenanceGraphLegend";
import { ProvenanceNodeShape } from "./ProvenanceNodeShape";
import {
  ProvenanceGraphViewportControls,
  ProvenanceGraphViewportFocusStyles,
  ProvenanceGraphViewportFooterHint,
} from "./ProvenanceGraphViewportChrome";

export type ProvenanceGraphViewportProps = {
  readonly nodes: readonly ArchitectureLinkageNode[];
  readonly edges: readonly ArchitectureLinkageEdge[];
  readonly selectedNodeId: string | null;
  readonly highlightedEdgeId: string | null;
  readonly activeFilters: ReadonlySet<ProvenanceNodeFilterCategory>;
  readonly layoutSeed: number;
  readonly onSelectNode: (nodeId: string | null) => void;
  readonly onHighlightEdge: (edgeId: string | null) => void;
  readonly renderFailed?: boolean;
  readonly onRetryRender?: () => void;
  readonly onOpenTablesView?: () => void;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ProvenanceGraphViewport(props: ProvenanceGraphViewportProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const markerId = useId().replace(/:/g, "");
  const [containerSize, setContainerSize] = useState({ width: 0, height: PROVENANCE_GRAPH_MIN_HEIGHT_PX });
  const [transform, setTransform] = useState<ProvenanceViewportTransform>({ scale: 1, translateX: 0, translateY: 0 });
  const [layoutReady, setLayoutReady] = useState(false);
  const [legendOpen, setLegendOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panOrigin = useRef<{ x: number; y: number; transform: ProvenanceViewportTransform } | null>(null);
  const fitScheduled = useRef(false);

  const visibleNodes = useMemo(
    () => props.nodes.filter((node) => provenanceNodeMatchesFilter(node, props.activeFilters)),
    [props.activeFilters, props.nodes],
  );

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes]);

  const visibleEdges = useMemo(
    () =>
      props.edges.filter(
        (edge) => visibleNodeIds.has(edge.fromNodeId) && visibleNodeIds.has(edge.toNodeId),
      ),
    [props.edges, visibleNodeIds],
  );

  const layoutPayload = useMemo(
    () => ({
      nodes: visibleNodes,
      edges: visibleEdges,
    }),
    [visibleEdges, visibleNodes],
  );

  const layoutKey = `${props.layoutSeed}:${visibleNodes.length}:${visibleEdges.length}`;
  const { result: offloadedLayout, pending: layoutPending, error: layoutError } = useInpOffloadTask(
    "provenanceLayout",
    layoutPayload,
    layoutKey,
  );

  const emptyLayout = useMemo(() => computeProvenanceGraphLayout([], []), []);

  const layout = offloadedLayout ?? emptyLayout;

  const posById = useMemo(() => new Map(layout.nodes.map((node) => [node.id, node])), [layout.nodes]);

  const connectedNodeIds = useMemo(() => {
    if (props.selectedNodeId === null) {
      return new Set<string>();
    }

    const ids = new Set<string>();

    for (const edge of visibleEdges) {
      if (edge.fromNodeId === props.selectedNodeId) {
        ids.add(edge.toNodeId);
      }

      if (edge.toNodeId === props.selectedNodeId) {
        ids.add(edge.fromNodeId);
      }
    }

    return ids;
  }, [props.selectedNodeId, visibleEdges]);

  const legendEntries = useMemo(() => provenanceLegendEntriesForNodes(visibleNodes), [visibleNodes]);

  const fitToView = useCallback(
    (behavior: ScrollBehavior = "auto") => {
      const width = containerSize.width;
      const height = containerSize.height;

      if (width <= 0 || height <= 0) {
        return;
      }

      const next = computeFitToViewTransform(layout.bounds, width, height);
      setTransform(next);
      setLayoutReady(true);

      if (!prefersReducedMotion() && behavior === "smooth") {
        // transform applies immediately; smooth behavior reserved for scroll actions
      }
    },
    [containerSize.height, containerSize.width, layout.bounds],
  );

  const resetLayout = useCallback(() => {
    fitToView();
  }, [fitToView]);

  const zoomBy = useCallback(
    (factor: number) => {
      const rect = containerRef.current?.getBoundingClientRect();

      if (rect === undefined) {
        return;
      }

      const focalX = rect.width / 2;
      const focalY = rect.height / 2;
      setTransform((current) => applyProvenanceZoomAtPoint(current, current.scale * factor, focalX, focalY));
    },
    [],
  );

  const centerOnNode = useCallback(
    (nodeId: string) => {
      const node = posById.get(nodeId);
      const width = containerSize.width;
      const height = containerSize.height;

      if (node === undefined || width <= 0 || height <= 0) {
        return;
      }

      setTransform((current) => ({
        scale: Math.max(current.scale, 0.85),
        translateX: width / 2 - node.x * current.scale,
        translateY: height / 2 - node.y * current.scale,
      }));
    },
    [containerSize.height, containerSize.width, posById],
  );

  useEffect(() => {
    const element = containerRef.current;

    if (element === null) {
      return;
    }

    const measure = (): void => {
      const rect = element.getBoundingClientRect();
      const parentWidth = element.parentElement?.clientWidth ?? 0;
      const width = Math.max(Math.floor(rect.width), Math.floor(parentWidth), 320);
      const height = Math.max(PROVENANCE_GRAPH_MIN_HEIGHT_PX, Math.floor(rect.height) || PROVENANCE_GRAPH_MIN_HEIGHT_PX);

      setContainerSize({ width, height });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [expanded]);

  useEffect(() => {
    setLayoutReady(false);
    fitScheduled.current = false;
  }, [layout.bounds, props.layoutSeed, props.activeFilters]);

  useEffect(() => {
    if (containerSize.width <= 0 || fitScheduled.current) {
      return;
    }

    fitScheduled.current = true;
    const frame = window.requestAnimationFrame(() => {
      fitToView();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [containerSize.width, containerSize.height, fitToView, layout.bounds]);

  useEffect(() => {
    if (props.selectedNodeId !== null) {
      centerOnNode(props.selectedNodeId);
    }
  }, [centerOnNode, props.selectedNodeId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        props.onSelectNode(null);
        props.onHighlightEdge(null);
        return;
      }

      const target = event.target;

      if (target instanceof HTMLElement && target.closest("[data-provenance-graph-controls='true']") === null) {
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomBy(PROVENANCE_GRAPH_ZOOM_STEP);
      }

      if (event.key === "-") {
        event.preventDefault();
        zoomBy(1 / PROVENANCE_GRAPH_ZOOM_STEP);
      }

      if (event.key === "0") {
        event.preventDefault();
        fitToView();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [fitToView, props, zoomBy]);

  const onWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }

    event.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();

    if (rect === undefined) {
      return;
    }

    const focalX = event.clientX - rect.left;
    const focalY = event.clientY - rect.top;
    const factor = event.deltaY < 0 ? PROVENANCE_GRAPH_ZOOM_STEP : 1 / PROVENANCE_GRAPH_ZOOM_STEP;
    setTransform((current) => applyProvenanceZoomAtPoint(current, current.scale * factor, focalX, focalY));
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }

      const target = event.target as HTMLElement;

      if (target.closest("[data-provenance-node='true']") !== null) {
        return;
      }

      panOrigin.current = {
        x: event.clientX,
        y: event.clientY,
        transform,
      };
      setIsPanning(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [transform],
  );

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const origin = panOrigin.current;

    if (origin === null) {
      return;
    }

    const deltaX = event.clientX - origin.x;
    const deltaY = event.clientY - origin.y;
    setTransform(provenancePanTransform(origin.transform, deltaX, deltaY));
  }, []);

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    panOrigin.current = null;
    setIsPanning(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  if (props.renderFailed) {
    return (
      <div
        className="rounded-md border border-amber-600/40 bg-al-surface-raised p-4 text-al-text-primary dark:border-amber-700/50"
        data-testid="provenance-graph-fallback"
      >
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
          The provenance graph could not be rendered. Open Timeline or Tables to inspect linkage points and recorded
          events.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {props.onOpenTablesView !== undefined ? (
            <Button type="button" variant="default" size="sm" className="h-8" onClick={props.onOpenTablesView}>
              Open Tables view
            </Button>
          ) : null}
          {props.onRetryRender !== undefined ? (
            <Button type="button" variant="outline" size="sm" className="h-8" onClick={props.onRetryRender}>
              Retry graph
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (props.nodes.length === 0) {
    return (
      <p
        className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
        data-testid="provenance-graph-empty"
      >
        No provenance linkage points recorded for this review.
      </p>
    );
  }

  if (visibleNodes.length === 0) {
    return (
      <p
        className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
        data-testid="provenance-graph-empty"
      >
        No graph nodes match the current filters.
      </p>
    );
  }

  if (layoutError !== null) {
    return (
      <div
        className="rounded-md border border-amber-600/40 bg-al-surface-raised p-4 text-al-text-primary dark:border-amber-700/50"
        data-testid="provenance-graph-layout-error"
      >
        <h4 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Graph layout failed</h4>
        <p className={cn("mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{layoutError}</p>
        {props.onRetryRender !== undefined ? (
          <Button type="button" variant="outline" size="sm" className="mt-3 h-8" onClick={props.onRetryRender}>
            Retry layout
          </Button>
        ) : null}
      </div>
    );
  }

  const shellClass = cn(
    "relative w-full overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950",
    expanded ? "fixed inset-0 z-50 rounded-none border-0" : "",
  );

  const viewportHeight = expanded ? "100vh" : `${Math.max(PROVENANCE_GRAPH_MIN_HEIGHT_PX, containerSize.height)}px`;
  const graphSummaryLabel = `Provenance graph with ${visibleNodes.length} nodes and ${visibleEdges.length} relationships`;
  const labelFontSize = PROVENANCE_GRAPH_MIN_LABEL_FONT_PX / Math.max(transform.scale, 0.01);
  const graphReady = layoutReady && !layoutPending && layoutError === null;

  return (
    <div className={shellClass} data-testid="provenance-graph-viewport" data-expanded={expanded ? "true" : "false"}>
      <div
        ref={containerRef}
        className={cn("relative w-full touch-none select-none", isPanning ? "cursor-grabbing" : "cursor-grab")}
        style={{ height: viewportHeight, minHeight: PROVENANCE_GRAPH_MIN_HEIGHT_PX }}
        aria-label="Provenance graph viewport"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        data-testid="provenance-graph-container"
      >
        {layoutPending || !graphReady ? (
          <div
            className="absolute inset-0 animate-pulse bg-neutral-100 dark:bg-neutral-900"
            data-testid="provenance-graph-skeleton"
            aria-hidden="true"
          />
        ) : null}

        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          className={cn("block", graphReady ? "opacity-100" : "opacity-0")}
          role="group"
          aria-label={graphSummaryLabel}
          data-testid="provenance-graph-svg"
        >
          <defs>
            <marker id={markerId} markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#64748b" />
            </marker>
          </defs>
          <g transform={provenanceTransformToSvg(transform)}>
            {visibleEdges.map((edge) => {
              const from = posById.get(edge.fromNodeId);
              const to = posById.get(edge.toNodeId);

              if (from === undefined || to === undefined) {
                return null;
              }

              const selected =
                props.selectedNodeId !== null &&
                (edge.fromNodeId === props.selectedNodeId || edge.toNodeId === props.selectedNodeId);
              const highlighted = props.highlightedEdgeId === edge.id;
              const dimmed =
                props.selectedNodeId !== null &&
                !selected &&
                props.highlightedEdgeId === null;

              return (
                <g key={edge.id} data-testid={`provenance-edge-${edge.id}`}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={highlighted || selected ? "var(--al-accent-interactive)" : "#94a3b8"}
                    strokeWidth={highlighted ? 2.5 : selected ? 2 : 1.25}
                    markerEnd={`url(#${markerId})`}
                    className={dimmed ? "prov-graph-edge-dimmed" : undefined}
                  />
                  <title>{`${edge.type}: ${from.fullLabel} → ${to.fullLabel}`}</title>
                </g>
              );
            })}
            {layout.nodes.map((node) => {
              const selected = props.selectedNodeId === node.id;
              const connected = connectedNodeIds.has(node.id);
              const dimmed =
                props.selectedNodeId !== null && !selected && !connected && props.highlightedEdgeId === null;
              const nodeTypeLabel = provenanceNodeTypeLabel(node.type);
              const nodeRadius = selected ? node.radius + 4 : node.radius;

              return (
                <g
                  key={node.id}
                  data-provenance-node="true"
                  data-testid={`provenance-node-${node.id}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${node.fullLabel}, ${nodeTypeLabel}`}
                  className="cursor-pointer outline-none focus-visible:outline-none"
                  onClick={(event) => {
                    event.stopPropagation();
                    props.onSelectNode(node.id);
                    props.onHighlightEdge(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") {
                      return;
                    }

                    event.preventDefault();
                    event.stopPropagation();
                    props.onSelectNode(node.id);
                    props.onHighlightEdge(null);
                  }}
                >
                  <rect
                    className={cn("prov-node-focus-indicator opacity-0", selected ? "opacity-100" : undefined)}
                    x={node.x - nodeRadius - 6}
                    y={node.y - nodeRadius - 6}
                    width={(nodeRadius + 6) * 2}
                    height={(nodeRadius + 6) * 2 + node.labelHeight + 12}
                    rx={8}
                    fill="none"
                    stroke="var(--al-accent-interactive)"
                    strokeWidth={2}
                    pointerEvents="none"
                  />
                  <ProvenanceNodeShape node={node} selected={selected} connected={connected} dimmed={dimmed} />
                  <text
                    x={node.x}
                    y={node.y + node.radius + 16}
                    textAnchor="middle"
                    fontSize={labelFontSize}
                    fill={dimmed ? "var(--al-text-disabled)" : "var(--al-text-secondary)"}
                    className="pointer-events-none"
                  >
                    {node.labelLines.map((line, index) => (
                      <tspan key={`${node.id}-${index}`} x={node.x} dy={index === 0 ? 0 : PROVENANCE_LABEL_LINE_HEIGHT}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                  <title>{`${node.fullLabel}\n${nodeTypeLabel}`}</title>
                </g>
              );
            })}
          </g>
        </svg>

        <ProvenanceGraphViewportControls
          expanded={expanded}
          onExpandedChange={setExpanded}
          onZoomBy={zoomBy}
          onFitToView={() => fitToView()}
          onResetLayout={resetLayout}
        />

        <ProvenanceGraphLegend
          legendOpen={legendOpen}
          onLegendOpenChange={setLegendOpen}
          legendEntries={legendEntries}
        />
      </div>
      <ProvenanceGraphViewportFooterHint />
      <ProvenanceGraphViewportFocusStyles />
    </div>
  );
}
