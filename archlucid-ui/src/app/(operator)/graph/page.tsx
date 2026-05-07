"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { GraphIdleLegend, GRAPH_MODE_NATIVE_TITLES } from "@/components/GraphIdleLegend";
import { GraphNodeKindLegendChips } from "@/components/GraphNodeKindLegendChips";
import { GraphReviewTrailLegendChips } from "@/components/GraphReviewTrailLegendChips";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { EmptyState } from "@/components/EmptyState";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorLoadingNotice, OperatorMalformedCallout, OperatorTryNext } from "@/components/OperatorShellMessage";
import { GRAPH_IDLE } from "@/lib/empty-state-presets";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { coerceGraphViewModel } from "@/lib/operator-response-guards";
import {
  getArchitectureGraph,
  getDecisionSubgraph,
  getNodeNeighborhood,
  getProvenanceGraph,
  mergeArchitectureGraphPages,
} from "@/lib/graph-api";
import { isApiRequestError } from "@/lib/api-request-error";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { isStaticDemoPayloadFallbackActiveForRun, isStaticDemoPayloadFallbackEnabled, tryStaticDemoProvenanceGraph } from "@/lib/operator-static-demo";
import { graphLooksLikeCoordinatorProvenanceTrail } from "@/lib/graph-mapper";
import { provenanceLinkageToGraphViewModel } from "@/lib/provenance-linkage-to-graph-vm";
import { applyBuyerLabelsToProvenanceGraphViewModel } from "@/lib/provenance-graph-presentation";
import type { GraphViewModel } from "@/types/graph";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const GraphViewer = dynamic(
  () => import("@/components/GraphViewer").then((m) => m.GraphViewer),
  {
    ssr: false,
    loading: () => (
      <div
        data-testid="graph-viewer-chunk-loading"
        className="flex min-h-[320px] w-full items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50/80 dark:border-neutral-600 dark:bg-neutral-900/40"
        role="status"
        aria-live="polite"
        aria-label="Loading graph viewer"
      >
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">Preparing interactive graph…</p>
      </div>
    ),
  },
);

/** Graph visualization mode: which endpoint to query and what graph subset to display. */
type GraphMode =
  | "provenance-full"
  | "decision-subgraph"
  | "node-neighborhood"
  | "architecture";

function applyProvenanceDemoPresentationIfEligible(
  model: GraphViewModel,
  mode: GraphMode,
  runIdTrimmed: string,
): GraphViewModel {
  if (mode !== "provenance-full") {
    return model;
  }

  const demoUi =
    isBuyerPolishedOperatorShellEnv() ||
    isNextPublicDemoMode() ||
    isStaticDemoPayloadFallbackEnabled() ||
    isStaticDemoPayloadFallbackActiveForRun(runIdTrimmed);

  if (!demoUi) {
    return model;
  }

  if (!graphLooksLikeCoordinatorProvenanceTrail(model)) {
    return model;
  }

  return applyBuyerLabelsToProvenanceGraphViewModel(model);
}

/** Interactive graph viewer page. Operator picks a review, graph mode, and optional filters. */
export default function GraphPage() {
  const workspaceRun = useWorkspaceActiveRun();
  const [runId, setRunId] = useState(SHOWCASE_STATIC_DEMO_RUN_ID);
  const [decisionId, setDecisionId] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [depth, setDepth] = useState(1);
  const [mode, setMode] = useState<GraphMode>("provenance-full");
  const [graph, setGraph] = useState<GraphViewModel | null>(null);
  const [loadFailure, setLoadFailure] = useState<ApiLoadFailureState | null>(null);
  const [malformedMessage, setMalformedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [architectureGraphNote, setArchitectureGraphNote] = useState<string | null>(null);

  const loadGenRef = useRef(0);

  useEffect(() => {
    const fromWorkspace = workspaceRun?.activeRunId?.trim() ?? "";

    if (fromWorkspace.length === 0) {
      return;
    }

    setRunId(fromWorkspace);
  }, [workspaceRun?.activeRunId]);

  const nodeTypes = useMemo(() => {
    if (!graph) {
      return [];
    }

    const set = new Set(graph.nodes.map((n) => n.type));

    return [...set].sort((a, b) => a.localeCompare(b));
  }, [graph]);

  const performGraphLoad = useCallback(async () => {
    const gen = ++loadGenRef.current;
    setLoading(true);
    setLoadFailure(null);
    setMalformedMessage(null);
    setArchitectureGraphNote(null);

    const tryStaticProvenance = (): void => {
      if (gen !== loadGenRef.current) {
        return;
      }

      if (mode !== "provenance-full") {
        return;
      }

      const rid = runId.trim();
      const prov = tryStaticDemoProvenanceGraph(rid);

      if (prov === null) {
        return;
      }

      setLoadFailure(null);
      setMalformedMessage(null);
      setGraph(
        applyProvenanceDemoPresentationIfEligible(
          provenanceLinkageToGraphViewModel(prov),
          mode,
          rid,
        ),
      );
      setTypeFilter("");
    };

    try {
      let raw: unknown;

      switch (mode) {
        case "provenance-full":
          raw = await getProvenanceGraph(runId);
          break;
        case "decision-subgraph":
          raw = await getDecisionSubgraph(runId, decisionId);
          break;
        case "node-neighborhood":
          raw = await getNodeNeighborhood(runId, nodeId, depth);
          break;
        case "architecture":
          try {
            raw = await getArchitectureGraph(runId);
          } catch (err) {
            const rid = runId.trim();

            if (
              !isApiRequestError(err) ||
              err.httpStatus !== 413 ||
              rid.length === 0
            )
              throw err;

            raw = await mergeArchitectureGraphPages(rid);
            setArchitectureGraphNote(
              "Full graph response exceeded the API size limit; loaded all pages via the paginated endpoint. Edges appear only when both endpoints fall on the same page — some cross-page links may be missing from this view.",
            );
          }
          break;
        default:
          throw new Error("Unsupported graph mode.");
      }

      const coerced = coerceGraphViewModel(raw);

      if (!coerced.ok) {
        if (gen !== loadGenRef.current) {
          return;
        }

        setGraph(null);
        setMalformedMessage(coerced.message);
        tryStaticProvenance();

        return;
      }

      if (gen !== loadGenRef.current) {
        return;
      }

      let nextGraph = coerced.value;

      if (
        mode === "provenance-full" &&
        nextGraph.nodes.length === 0 &&
        nextGraph.edges.length === 0
      ) {
        const prov = tryStaticDemoProvenanceGraph(runId.trim());

        if (prov !== null) {
          nextGraph = provenanceLinkageToGraphViewModel(prov);
        }
      }

      setGraph(applyProvenanceDemoPresentationIfEligible(nextGraph, mode, runId.trim()));
      setTypeFilter("");
      if (mode !== "architecture") {
        setArchitectureGraphNote(null);
      }
    } catch (err) {
      if (gen !== loadGenRef.current) {
        return;
      }

      setLoadFailure(toApiLoadFailure(err));
      setGraph(null);
      tryStaticProvenance();
    } finally {
      if (gen === loadGenRef.current) {
        setLoading(false);
      }
    }
  }, [mode, runId, decisionId, nodeId, depth]);

  const performRef = useRef(performGraphLoad);
  performRef.current = performGraphLoad;

  useEffect(() => {
    const rid = runId.trim();

    if (rid.length === 0) {
      return;
    }

    if (mode !== "provenance-full") {
      return;
    }

    void performRef.current();
  }, [runId, mode]);

  useEffect(() => {
    const rid = runId.trim();
    const demo =
      isBuyerPolishedOperatorShellEnv() ||
      isNextPublicDemoMode() ||
      isStaticDemoPayloadFallbackEnabled() ||
      isStaticDemoPayloadFallbackActiveForRun(rid);

    if (!demo || mode !== "provenance-full") {
      return;
    }

    const prov = tryStaticDemoProvenanceGraph(rid);

    if (prov === null) {
      return;
    }

    setGraph(
      applyProvenanceDemoPresentationIfEligible(provenanceLinkageToGraphViewModel(prov), mode, rid),
    );
  }, [runId, mode]);

  const showIdleCard =
    !graph && !loading && loadFailure === null && malformedMessage === null;

  const demoUi =
    isBuyerPolishedOperatorShellEnv() ||
    isNextPublicDemoMode() ||
    isStaticDemoPayloadFallbackEnabled() ||
    isStaticDemoPayloadFallbackActiveForRun(runId.trim());

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const graphIdlePreset = useMemo(() => {
    if (demoUi && showIdleCard) {
      return {
        ...GRAPH_IDLE,
        title: "Review trail graph",
        description:
          "The Claims Intake sample draws how the review advances from captured context through analysis, flagship risks, the finalized manifest, and bundled deliverables. The graph loads automatically — if the canvas stays empty, choose Load graph above.",
      };
    }

    return GRAPH_IDLE;
  }, [demoUi, showIdleCard]);

  const leadIntro = demoUi
    ? "Interactive review-trail graph for the selected architecture review. Controls below switch reviews or graph mode."
    : "Select a review, choose a graph mode, then load the graph. The preview includes decisions, findings, artifacts, review events, and architecture entities.";

  const pageTitle = demoUi || buyerPolishedShell ? "Review trail graph" : "Review evidence graph";

  const loadButtonLabel = loading ? "Loading…" : "Load graph";

  const showLoadButton = !demoUi || mode !== "provenance-full" || graph === null;

  const graphControls = (
    <div
      className={cn(
        "mb-6 flex max-w-4xl flex-nowrap items-end gap-3 overflow-x-auto rounded-lg border border-neutral-200 bg-white/60 p-3 dark:border-neutral-700 dark:bg-neutral-900/40",
        graph !== null ? "mt-6" : null,
      )}
    >
      <div className="min-w-[12rem] flex-1 lg:max-w-sm">
        <AskRunIdPicker
          value={runId}
          onChange={setRunId}
          selectedThreadId=""
          fieldId="graph-run"
          label="Review"
        />
      </div>

      <div className="min-w-[10rem] lg:w-auto">
        <Label htmlFor="graph-mode-select" className="text-[13px] font-semibold">
          Graph mode
        </Label>
        <select
          id="graph-mode-select"
          value={mode}
          onChange={(e) => setMode(e.target.value as GraphMode)}
          className={cn(
            "mt-1.5 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100",
            "lg:w-[220px]",
          )}
        >
          <option value="provenance-full" title={GRAPH_MODE_NATIVE_TITLES["provenance-full"]}>
            Review trail graph
          </option>
          <option value="decision-subgraph" title={GRAPH_MODE_NATIVE_TITLES["decision-subgraph"]}>
            Decision focus
          </option>
          <option value="node-neighborhood" title={GRAPH_MODE_NATIVE_TITLES["node-neighborhood"]}>
            Node connections
          </option>
          <option value="architecture" title={GRAPH_MODE_NATIVE_TITLES.architecture}>
            Architecture graph
          </option>
        </select>
      </div>

      {showLoadButton ? (
        <Button
          type="button"
          variant="primary"
          className="w-full lg:w-auto"
          onClick={() => void performGraphLoad()}
          disabled={
            loading ||
            runId.trim().length === 0 ||
            (mode === "decision-subgraph" && decisionId.trim().length === 0) ||
            (mode === "node-neighborhood" && nodeId.trim().length === 0)
          }
        >
          {loadButtonLabel}
        </Button>
      ) : null}
    </div>
  );

  return (
    <main>
      <LayerHeader pageKey="graph" />
      <OperatorPageHeader title={pageTitle} helpKey="architecture-graph" />
      {graph === null ? (
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">{leadIntro}</p>
      ) : null}

      {graph === null ? graphControls : null}

      {mode === "decision-subgraph" ? (
        <div className="mb-3 max-w-4xl">
          <Label htmlFor="graph-decision-id">Decision ID</Label>
          <Input
            id="graph-decision-id"
            value={decisionId}
            onChange={(e) => setDecisionId(e.target.value)}
            placeholder="e.g. claims.intake.boundary"
            className="mt-1.5 max-w-xl font-mono text-sm"
          />
        </div>
      ) : null}

      {mode === "node-neighborhood" ? (
        <div className="mb-3 flex max-w-4xl flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 sm:max-w-md">
            <Label htmlFor="graph-node-id">Node ID</Label>
            <Input
              id="graph-node-id"
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              placeholder="Graph node identifier"
              className="mt-1.5 font-mono text-sm"
            />
          </div>
          <div>
            <Label htmlFor="graph-depth">Depth</Label>
            <Input
              id="graph-depth"
              type="number"
              min={0}
              max={10}
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="mt-1.5 w-20"
            />
          </div>
        </div>
      ) : null}

      {loading && (
        <OperatorLoadingNotice>
          <strong>Loading graph</strong>
          <p className="mt-2 text-sm">
            Preparing the graph view — reviews with rich evidence may take a few extra seconds.
          </p>
        </OperatorLoadingNotice>
      )}

      {loadFailure !== null && (
        <>
          <OperatorApiProblem failure={loadFailure} />
          <OperatorTryNext>
            This is usually a network, proxy, or HTTP error from the graph endpoint—not a malformed JSON body. Confirm the
            review exists in <Link href="/reviews?projectId=default">Reviews</Link>, retry the graph action above, and
            check the browser network tab for the failing <code>/v1/…/graph</code> call.
          </OperatorTryNext>
        </>
      )}

      {malformedMessage && (
        <>
          <OperatorMalformedCallout>
            <strong>Unexpected graph response shape.</strong>
            <p className="mt-2">{malformedMessage}</p>
            <p className="mt-2 text-sm">
              The call succeeded but the payload did not match the expected GraphViewModel (nodes and edges arrays).
              Check API version alignment.
            </p>
          </OperatorMalformedCallout>
          <OperatorTryNext>
            Compare <code>GET /version</code> on the API with your UI deployment. Try another review from{" "}
            <Link href="/reviews?projectId=default">Reviews</Link> if this review has partial graph data.
          </OperatorTryNext>
        </>
      )}

      {showIdleCard ? (
        <div className="space-y-4">
          <GraphIdleLegend />
          <EmptyState {...graphIdlePreset} />
        </div>
      ) : null}

      {architectureGraphNote && (
        <div
          className="mb-4 max-w-4xl rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          <strong>Large graph.</strong> {architectureGraphNote}
        </div>
      )}

      {graph ? (
        <>
          <ClientErrorBoundary title="Graph viewer failed to render">
            <div data-testid="graph-canvas-ready">
              <GraphViewer
                graph={graph}
                typeFilter={typeFilter}
                runId={runId.trim()}
                presentation={demoUi || buyerPolishedShell ? "buyerTrail" : "operator"}
              />
            </div>
          </ClientErrorBoundary>
          <div className="mb-3 flex items-center gap-3">
            <label>
              Filter by type{" "}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="ml-2 p-1.5"
              >
                <option value="">All types</option>
                {nodeTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <span className="text-neutral-500 dark:text-neutral-400 text-sm">
              {buyerPolishedShell
                ? `${graph.nodes.length} nodes in this view`
                : `${graph.nodes.length} nodes, ${graph.edges.length} edges (before filter)`}
            </span>
          </div>
          <div className="mb-3 max-w-4xl">
            <p className="m-0 mb-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">Legend</p>
            {graph !== null && graphLooksLikeCoordinatorProvenanceTrail(graph) && demoUi ? (
              <GraphReviewTrailLegendChips />
            ) : (
              <GraphNodeKindLegendChips />
            )}
          </div>
          {graphControls}
          {demoUi && buyerPolishedShell ? (
            <p className="m-0 mt-4 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
              Use the controls above to switch reviews or views. The sample review loads this graph automatically when data
              is available.
            </p>
          ) : null}
          {demoUi && !buyerPolishedShell ? (
            <p className="m-0 mt-4 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
              Use the controls above to switch reviews or exploration mode — the Claims Intake sample loads this graph
              automatically.
            </p>
          ) : null}
          {!demoUi ? (
            <p className="m-0 mt-4 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">{leadIntro}</p>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
