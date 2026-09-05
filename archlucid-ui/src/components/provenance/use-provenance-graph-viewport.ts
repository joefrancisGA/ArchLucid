"use client";

import { cn } from "@/lib/utils";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
} from "react";

import {
  computeProvenanceGraphLayout,
  type ProvenanceLayoutNode,
} from "@/lib/provenance-graph-layout";
import { useInpOffloadTask } from "@/lib/workers/inp-offload-client";
import {
  applyProvenanceZoomAtPoint,
  computeFitToViewTransform,
  PROVENANCE_GRAPH_MIN_HEIGHT_PX,
  PROVENANCE_GRAPH_ZOOM_STEP,
  provenancePanTransform,
  type ProvenanceViewportTransform,
} from "@/lib/provenance-graph-viewport";
import {
  provenanceLegendEntriesForNodes,
  type ProvenanceNodeFilterCategory,
  provenanceNodeMatchesFilter,
} from "@/lib/provenance-node-presentation";
import {
  parseProvGraphExpandedFromSearch,
  parseProvGraphLegendOpenFromSearch,
  provenanceGraphViewportHrefFromSearch,
} from "@/lib/provenance/provenance-graph-viewport-url";
import type { ArchitectureLinkageEdge, ArchitectureLinkageNode } from "@/types/architecture-provenance";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export type UseProvenanceGraphViewportOptions = {
  readonly nodes: readonly ArchitectureLinkageNode[];
  readonly edges: readonly ArchitectureLinkageEdge[];
  readonly selectedNodeId: string | null;
  readonly highlightedEdgeId: string | null;
  readonly activeFilters: ReadonlySet<ProvenanceNodeFilterCategory>;
  readonly layoutSeed: number;
  readonly onSelectNode: (nodeId: string | null) => void;
  readonly onHighlightEdge: (edgeId: string | null) => void;
};

function resolveInitialLegendOpen(raw: string | null | undefined): boolean {
  const parsed = parseProvGraphLegendOpenFromSearch(raw);

  if (parsed === null) {
    return true;
  }

  return parsed;
}

export function useProvenanceGraphViewport(props: UseProvenanceGraphViewportOptions) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const provGraphLegendOpenParam = searchParams.get("provGraphLegendOpen");
  const provGraphExpandedParam = searchParams.get("provGraphExpanded");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const markerId = useId().replace(/:/g, "");
  const [containerSize, setContainerSize] = useState({ width: 0, height: PROVENANCE_GRAPH_MIN_HEIGHT_PX });
  const [transform, setTransform] = useState<ProvenanceViewportTransform>({ scale: 1, translateX: 0, translateY: 0 });
  const [layoutReady, setLayoutReady] = useState(false);
  const [legendOpen, setLegendOpenState] = useState(() => resolveInitialLegendOpen(provGraphLegendOpenParam));
  const [expanded, setExpandedState] = useState(() => parseProvGraphExpandedFromSearch(provGraphExpandedParam));

  const syncLegendOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        provenanceGraphViewportHrefFromSearch(
          searchParams.toString(),
          { legendOpen: open, expanded, syncLegend: true },
          pathname,
        ),
        { scroll: false },
      );
    },
    [expanded, pathname, router, searchParams],
  );

  const syncExpandedToUrl = useCallback(
    (nextExpanded: boolean) => {
      router.replace(
        provenanceGraphViewportHrefFromSearch(
          searchParams.toString(),
          { legendOpen, expanded: nextExpanded, syncLegend: false },
          pathname,
        ),
        { scroll: false },
      );
    },
    [legendOpen, pathname, router, searchParams],
  );

  const setLegendOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setLegendOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncLegendOpenToUrl(next);

        return next;
      });
    },
    [syncLegendOpenToUrl],
  );

  const setExpanded = useCallback(
    (value: SetStateAction<boolean>) => {
      setExpandedState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncExpandedToUrl(next);

        return next;
      });
    },
    [syncExpandedToUrl],
  );

  useEffect(() => {
    if (provGraphLegendOpenParam === null) {
      return;
    }

    setLegendOpenState(resolveInitialLegendOpen(provGraphLegendOpenParam));
  }, [provGraphLegendOpenParam]);

  useEffect(() => {
    setExpandedState(parseProvGraphExpandedFromSearch(provGraphExpandedParam));
  }, [provGraphExpandedParam]);
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

  const handleSelectNode = useCallback(
    (nodeId: string) => {
      props.onSelectNode(nodeId);
      props.onHighlightEdge(null);
    },
    [props],
  );

  const shellClass = cn(
    "relative w-full overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950",
    expanded ? "fixed inset-0 z-50 rounded-none border-0" : "",
  );

  const viewportHeight = expanded ? "100vh" : `${Math.max(PROVENANCE_GRAPH_MIN_HEIGHT_PX, containerSize.height)}px`;
  const graphSummaryLabel = `Provenance graph with ${visibleNodes.length} nodes and ${visibleEdges.length} relationships`;
  const graphReady = layoutReady && !layoutPending && layoutError === null;

  return {
    containerRef,
    svgRef,
    markerId,
    transform,
    legendOpen,
    setLegendOpen,
    expanded,
    setExpanded,
    isPanning,
    visibleNodes,
    visibleEdges,
    layout,
    posById,
    connectedNodeIds,
    legendEntries,
    layoutPending,
    layoutError,
    fitToView,
    resetLayout,
    zoomBy,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    handleSelectNode,
    shellClass,
    viewportHeight,
    graphSummaryLabel,
    graphReady,
    selectedNodeId: props.selectedNodeId,
    highlightedEdgeId: props.highlightedEdgeId,
  };
}

export type { ProvenanceLayoutNode };
