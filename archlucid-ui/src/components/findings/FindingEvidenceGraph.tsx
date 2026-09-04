"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

import { FindingEvidenceGraphOutline } from "@/components/findings/FindingEvidenceGraphOutline";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorEmptyState, OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import {
  applyFindingEvidenceGraphHighlight,
  defaultFindingEvidenceGraphPresentationMode,
  defaultFindingEvidenceGraphViewMode,
  resolveFindingEvidenceGraphViewModel,
  type FindingEvidenceGraphPresentationMode,
  type FindingEvidenceGraphViewMode,
} from "@/lib/findings/finding-evidence-graph-highlight";
import {
  findingEvidenceGraphViewHrefFromSearch,
  parseFindingEvidenceGraphPresentationFromSearch,
  parseFindingEvidenceGraphViewFromSearch,
} from "@/lib/findings/finding-evidence-graph-view-url";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { loadArchitectureGraphViewModel } from "@/lib/load-architecture-graph-view-model";
import { mapGraphToReactFlow } from "@/lib/graph-mapper";
import { useInpOffloadTask } from "@/lib/workers/inp-offload-client";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import type { GraphViewModel } from "@/types/graph";

export type FindingEvidenceGraphProps = {
  readonly runId: string;
  readonly graphNodeIdsExamined: readonly string[];
};

function GraphFitViewOnChange(props: { nodeCount: number; edgeCount: number; viewMode: FindingEvidenceGraphViewMode }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (props.nodeCount === 0) {
      return;
    }

    let canceled = false;
    const outer = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!canceled) {
          void fitView({ padding: 0.12, maxZoom: 1.4, duration: 220 });
        }
      });
    });

    return () => {
      canceled = true;
      window.cancelAnimationFrame(outer);
    };
  }, [props.nodeCount, props.edgeCount, props.viewMode, fitView]);

  return null;
}

function FindingEvidenceGraphCanvas(props: {
  readonly graph: GraphViewModel;
  readonly graphNodeIdsExamined: readonly string[];
  readonly viewMode: FindingEvidenceGraphViewMode;
}) {
  const offloadPayload = useMemo(
    () => ({
      graph: props.graph,
      graphNodeIdsExamined: props.graphNodeIdsExamined,
      viewMode: props.viewMode,
    }),
    [props.graph, props.graphNodeIdsExamined, props.viewMode],
  );

  const offloadKey = `${props.viewMode}:${props.graphNodeIdsExamined.join(",")}:${props.graph.nodeCount}:${props.graph.edgeCount}`;
  const { result: highlighted, pending } = useInpOffloadTask(
    "findingEvidenceGraphPrep",
    offloadPayload,
    offloadKey,
  );

  const fallbackHighlighted = useMemo(() => {
    const filteredGraph = resolveFindingEvidenceGraphViewModel(
      props.graph,
      props.graphNodeIdsExamined,
      props.viewMode,
    );
    const mapped = mapGraphToReactFlow(filteredGraph, "operator");

    return applyFindingEvidenceGraphHighlight(
      mapped.nodes,
      mapped.edges,
      props.graphNodeIdsExamined,
      props.viewMode,
    );
  }, [props.graph, props.graphNodeIdsExamined, props.viewMode]);

  const rendered = highlighted ?? fallbackHighlighted;

  if (pending && highlighted === null) {
    return (
      <OperatorLoadingNotice>
        <strong>Preparing evidence graph…</strong>
      </OperatorLoadingNotice>
    );
  }

  if (rendered.nodes.length === 0) {
    return (
      <OperatorEmptyState title="No matching graph nodes">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
          The examined node ids for this finding do not appear on the architecture graph for this review.
        </p>
      </OperatorEmptyState>
    );
  }

  return (
    <div
      className="h-[min(42vh,360px)] min-h-[240px] w-full rounded-md border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950/40"
      data-testid="finding-evidence-graph-canvas"
    >
      <ReactFlowProvider>
        <ReactFlow
          nodes={rendered.nodes}
          edges={rendered.edges}
          fitView
          fitViewOptions={{ padding: 0.12, maxZoom: 1.4 }}
          minZoom={0.15}
          maxZoom={1.6}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <GraphFitViewOnChange
            nodeCount={rendered.nodes.length}
            edgeCount={rendered.edges.length}
            viewMode={props.viewMode}
          />
          <Controls showInteractive={false} />
          <Background variant={BackgroundVariant.Dots} gap={18} size={1} className="opacity-50" />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}

/**
 * Interactive evidence graph for a finding: highlights `graphNodeIdsExamined` on the run architecture graph.
 */
export function FindingEvidenceGraph(props: FindingEvidenceGraphProps) {
  const { runId, graphNodeIdsExamined } = props;
  const router = useRouter();
  const pathname = usePathname() ?? `/architecture/reviews/${encodeURIComponent(runId)}`;
  const searchParams = useSearchParams();
  const urlEvGraphView = parseFindingEvidenceGraphViewFromSearch(searchParams.get("evGraphView"));
  const urlEvPresentation = parseFindingEvidenceGraphPresentationFromSearch(searchParams.get("evPresentation"));
  const { isWorkingMode, mounted: workspaceMounted } = useWorkspaceMode();
  const workingMode = workspaceMounted && isWorkingMode;
  const [graph, setGraph] = useState<GraphViewModel | null>(null);
  const [loadNote, setLoadNote] = useState<string | null>(null);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewMode, setViewModeState] = useState<FindingEvidenceGraphViewMode>(
    urlEvGraphView ?? defaultFindingEvidenceGraphViewMode(graphNodeIdsExamined.length),
  );
  const [presentationMode, setPresentationModeState] = useState<FindingEvidenceGraphPresentationMode>(
    urlEvPresentation ?? defaultFindingEvidenceGraphPresentationMode(workingMode),
  );

  const syncEvidenceGraphViewToUrl = useCallback(
    (nextViewMode: FindingEvidenceGraphViewMode, nextPresentationMode: FindingEvidenceGraphPresentationMode) => {
      router.replace(
        findingEvidenceGraphViewHrefFromSearch(
          searchParams.toString(),
          { viewMode: nextViewMode, presentationMode: nextPresentationMode },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setViewMode = useCallback(
    (nextViewMode: FindingEvidenceGraphViewMode) => {
      setViewModeState(nextViewMode);
      syncEvidenceGraphViewToUrl(nextViewMode, presentationMode);
    },
    [presentationMode, syncEvidenceGraphViewToUrl],
  );

  const setPresentationMode = useCallback(
    (nextPresentationMode: FindingEvidenceGraphPresentationMode) => {
      setPresentationModeState(nextPresentationMode);
      syncEvidenceGraphViewToUrl(viewMode, nextPresentationMode);
    },
    [syncEvidenceGraphViewToUrl, viewMode],
  );

  useEffect(() => {
    if (urlEvGraphView !== null) {
      setViewModeState(urlEvGraphView);
    }

    if (urlEvPresentation !== null) {
      setPresentationModeState(urlEvPresentation);
    }
  }, [urlEvGraphView, urlEvPresentation]);

  useEffect(() => {
    setPresentationModeState(defaultFindingEvidenceGraphPresentationMode(workingMode));
  }, [workingMode]);

  useEffect(() => {
    let canceled = false;

    void (async () => {
      setLoading(true);
      setFailure(null);
      setGraph(null);
      setLoadNote(null);

      const result = await loadArchitectureGraphViewModel(runId);

      if (canceled) {
        return;
      }

      if (!result.ok) {
        if (result.kind === "failure") {
          setFailure(result.failure);
        } else {
          setFailure({ message: result.message, problem: null, correlationId: null, httpStatus: null, retryAfterSeconds: null });
        }

        setLoading(false);

        return;
      }

      setGraph(result.graph);
      setLoadNote(result.note);
      setViewModeState(defaultFindingEvidenceGraphViewMode(graphNodeIdsExamined.length));
      setLoading(false);
    })();

    return () => {
      canceled = true;
    };
  }, [runId, graphNodeIdsExamined.length]);

  if (graphNodeIdsExamined.length === 0) {
    return (
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} data-testid="finding-evidence-graph-empty">
        No architecture graph nodes were recorded for this finding trace.
      </p>
    );
  }

  return (
    <section className="space-y-3" data-testid="finding-evidence-graph">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {viewMode === "reasoningPath"
            ? "The path ArchLucid followed to reach this finding. Teal marks the evidence it examined."
            : "The full architecture graph, with the evidence ArchLucid examined marked in teal."}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-pressed={presentationMode === "outline"}
          onClick={() => {
            setPresentationMode(presentationMode === "outline" ? "graph" : "outline");
          }}
        >
          {presentationMode === "outline" ? "Show graph view" : "Show list view"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-pressed={viewMode === "context"}
          onClick={() => {
            setViewMode(viewMode === "context" ? "reasoningPath" : "context");
          }}
        >
          {viewMode === "context" ? "Show reasoning path only" : "Show surrounding context"}
        </Button>
      </div>

      {loadNote !== null ? (
        <p className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)} role="status">
          {loadNote}
        </p>
      ) : null}

      {loading ? (
        <OperatorLoadingNotice>
          <strong>Loading architecture graph…</strong>
        </OperatorLoadingNotice>
      ) : null}

      {failure !== null ? (
        <OperatorApiProblem
          problem={failure.problem}
          fallbackMessage={failure.message}
          correlationId={failure.correlationId}
          httpStatus={failure.httpStatus}
          retryAfterSeconds={failure.retryAfterSeconds}
        />
      ) : null}

      {!loading && failure === null && graph !== null ? (
        presentationMode === "outline" ? (
          <FindingEvidenceGraphOutline graph={graph} graphNodeIdsExamined={graphNodeIdsExamined} />
        ) : (
          <FindingEvidenceGraphCanvas
            graph={graph}
            graphNodeIdsExamined={graphNodeIdsExamined}
            viewMode={viewMode}
          />
        )
      ) : null}
    </section>
  );
}
