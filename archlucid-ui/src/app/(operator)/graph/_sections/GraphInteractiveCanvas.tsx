"use client";

import dynamic from "next/dynamic";

import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { GraphStaticFallback } from "@/components/GraphStaticFallback";
import type { GraphViewModel } from "@/types/graph";
import { cn } from "@/lib/utils";

const GraphViewer = dynamic(
  () => import("@/components/GraphViewer").then((m) => m.GraphViewer),
  {
    ssr: false,
    loading: () => (
      <div
        data-testid="graph-viewer-chunk-loading"
        role="status"
        aria-live="polite"
        aria-label="Loading interactive evidence graph viewer"
      >
        <GraphStaticFallback />
      </div>
    ),
  },
);

export type GraphInteractiveCanvasProps = {
  graphSurfaceKey: string;
  buyerPolishedShell: boolean;
  graph: GraphViewModel;
  typeFilter: string;
  runIdTrimmed: string;
  presentation: "buyerTrail" | "operator";
  onInteractiveSurfaceReady?: () => void;
  defaultSelectedGraphNodeId?: string;
};

export function GraphInteractiveCanvas(props: GraphInteractiveCanvasProps) {
  const {
    graphSurfaceKey,
    buyerPolishedShell,
    graph,
    typeFilter,
    runIdTrimmed,
    presentation,
    onInteractiveSurfaceReady,
    defaultSelectedGraphNodeId,
  } = props;

  return (
    <ClientErrorBoundary title="Graph viewer failed to render">
      <div
        data-testid="graph-canvas-ready"
        key={graphSurfaceKey}
        className={cn("w-full min-h-[min(28rem,60vh)]", buyerPolishedShell && "min-h-[min(36rem,72vh)]")}
      >
        <GraphViewer
          graph={graph}
          typeFilter={typeFilter}
          runId={runIdTrimmed}
          presentation={presentation}
          onInteractiveSurfaceReady={onInteractiveSurfaceReady}
          defaultSelectedNodeId={
            defaultSelectedGraphNodeId !== undefined && defaultSelectedGraphNodeId.trim().length > 0
              ? defaultSelectedGraphNodeId.trim()
              : undefined
          }
        />
      </div>
    </ClientErrorBoundary>
  );
}
