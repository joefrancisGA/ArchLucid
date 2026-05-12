"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { GRAPH_IDLE } from "@/lib/empty-state-presets";
import {
  getArchitectureGraph,
  getDecisionSubgraph,
  getNodeNeighborhood,
  getProvenanceGraph,
  mergeArchitectureGraphPages,
} from "@/lib/graph-api";
import {
  isStaticDemoPayloadFallbackActiveForRun,
  isStaticDemoPayloadFallbackEnabled,
  tryStaticDemoProvenanceGraph,
} from "@/lib/operator-static-demo";
import { coerceGraphViewModel } from "@/lib/operator-response-guards";
import { provenanceLinkageToGraphViewModel } from "@/lib/provenance-linkage-to-graph-vm";
import { SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { GraphViewModel } from "@/types/graph";
import { GraphArchitectureNoteBanner } from "@/app/(operator)/graph/_sections/GraphArchitectureNoteBanner";
import { GraphFetchStatusAlerts } from "@/app/(operator)/graph/_sections/GraphFetchStatusAlerts";
import { GraphIdlePlaceholder } from "@/app/(operator)/graph/_sections/GraphIdlePlaceholder";
import {
  applyProvenanceDemoPresentationIfEligible,
  type GraphMode,
} from "@/app/(operator)/graph/_sections/graph-page-helpers";
import { GraphLoadedExperience } from "@/app/(operator)/graph/_sections/GraphLoadedExperience";
import { GraphModeAuxiliaryFields } from "@/app/(operator)/graph/_sections/GraphModeAuxiliaryFields";
import { GraphPageControls } from "@/app/(operator)/graph/_sections/GraphPageControls";
import { GraphPageIntroParagraph } from "@/app/(operator)/graph/_sections/GraphPageIntroParagraph";

export function GraphPageContent() {
  const searchParams = useSearchParams();
  const urlRunId = searchParams.get("runId")?.trim() ?? "";
  const workspaceRun = useWorkspaceActiveRun();
  const [runId, setRunId] = useState(() =>
    urlRunId.length > 0 ? urlRunId : SHOWCASE_STATIC_DEMO_RUN_ID,
  );
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
  const [graphInteractiveReady, setGraphInteractiveReady] = useState(false);

  const loadGenRef = useRef(0);

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const graphMainColumnMaxClass = buyerPolishedShell ? "max-w-6xl" : "max-w-4xl";

  const graphSurfaceKey = useMemo(() => {
    if (graph === null) {
      return "";
    }

    return `${runId.trim()}-${graph.nodes.length}-${graph.edges.length}`;
  }, [graph, runId]);

  useEffect(() => {
    if (graphSurfaceKey.length === 0) {
      setGraphInteractiveReady(false);

      return;
    }

    setGraphInteractiveReady(false);
  }, [graphSurfaceKey]);

  const handleGraphInteractiveSurfaceReady = useCallback(() => {
    setGraphInteractiveReady(true);
  }, []);

  useEffect(() => {
    if (urlRunId.length === 0) {
      return;
    }

    setRunId(urlRunId);
  }, [urlRunId]);

  useEffect(() => {
    if (urlRunId.length > 0) {
      return;
    }

    const fromWorkspace = workspaceRun?.activeRunId?.trim() ?? "";

    if (fromWorkspace.length === 0) {
      return;
    }

    setRunId(fromWorkspace);
  }, [workspaceRun?.activeRunId, urlRunId]);

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

    if (buyerPolishedShell) {
      setGraphInteractiveReady(false);
    }

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
        applyProvenanceDemoPresentationIfEligible(provenanceLinkageToGraphViewModel(prov), mode, rid),
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

            if (!isApiRequestError(err) || err.httpStatus !== 413 || rid.length === 0) throw err;

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

      if (mode === "provenance-full" && nextGraph.nodes.length === 0 && nextGraph.edges.length === 0) {
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
  }, [mode, runId, decisionId, nodeId, depth, buyerPolishedShell]);

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

    setGraph(applyProvenanceDemoPresentationIfEligible(provenanceLinkageToGraphViewModel(prov), mode, rid));
  }, [runId, mode]);

  const showIdleCard = !graph && !loading && loadFailure === null && malformedMessage === null;

  const demoUi =
    isBuyerPolishedOperatorShellEnv() ||
    isNextPublicDemoMode() ||
    isStaticDemoPayloadFallbackEnabled() ||
    isStaticDemoPayloadFallbackActiveForRun(runId.trim());

  useEffect(() => {
    if (!demoUi && !buyerPolishedShell) {
      return;
    }

    setMode("provenance-full");
  }, [buyerPolishedShell, demoUi]);

  const graphIdlePreset = useMemo(() => {
    if (demoUi && showIdleCard) {
      return {
        ...GRAPH_IDLE,
        title: BUYER_SURFACE_VOCABULARY.evidenceGraph,
        description: `${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE} traces evidence from captured context through prioritized risk findings to the signed manifest and deliverables. The graph loads automatically — if the canvas stays empty, expand advanced controls below and choose Load graph.`,
      };
    }

    return GRAPH_IDLE;
  }, [demoUi, showIdleCard]);

  const leadIntro =
    demoUi || buyerPolishedShell
      ? `Interactive ${BUYER_SURFACE_VOCABULARY.evidenceGraph.toLowerCase()} for the selected review. Emphasis: evidence → prioritized risk findings → mitigation decisions → sealed manifest outputs for ${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE}.`
      : "Select a review, choose a graph mode, then load the graph. The preview includes decisions, findings, artifacts, review events, and architecture entities.";

  const pageTitle = buyerPolishedShell ? "Decision traceability graph" : BUYER_SURFACE_VOCABULARY.evidenceGraph;

  const loadButtonLabel = loading ? "Loading…" : "Load graph";

  const showLoadButton = !demoUi || mode !== "provenance-full" || graph === null;

  const controls = (
    <GraphPageControls
      graphMainColumnMaxClass={graphMainColumnMaxClass}
      runId={runId}
      onRunIdChange={setRunId}
      mode={mode}
      onModeChange={setMode}
      demoUi={demoUi}
      buyerPolishedShell={buyerPolishedShell}
      showLoadButton={showLoadButton}
      loadButtonLabel={loadButtonLabel}
      loading={loading}
      onLoadGraph={performGraphLoad}
      decisionId={decisionId}
      nodeId={nodeId}
    />
  );

  return (
    <div>
      <LayerHeader pageKey="graph" />
      <OperatorPageHeader title={pageTitle} helpKey="architecture-graph" />
      {graph === null ? <GraphPageIntroParagraph demoUi={demoUi} buyerPolishedShell={buyerPolishedShell} leadIntro={leadIntro} /> : null}

      {graph === null ? controls : null}

      <GraphModeAuxiliaryFields
        mode={mode}
        graphMainColumnMaxClass={graphMainColumnMaxClass}
        decisionId={decisionId}
        onDecisionIdChange={setDecisionId}
        nodeId={nodeId}
        onNodeIdChange={setNodeId}
        depth={depth}
        onDepthChange={setDepth}
      />

      <GraphFetchStatusAlerts loading={loading} loadFailure={loadFailure} malformedMessage={malformedMessage} />

      {showIdleCard ? (
        <GraphIdlePlaceholder graphIdlePreset={graphIdlePreset} buyerPolishedShell={buyerPolishedShell} />
      ) : null}

      {architectureGraphNote && (
        <GraphArchitectureNoteBanner graphMainColumnMaxClass={graphMainColumnMaxClass} architectureGraphNote={architectureGraphNote} />
      )}

      {graph ? (
        <GraphLoadedExperience
          buyerPolishedShell={buyerPolishedShell}
          graphMainColumnMaxClass={graphMainColumnMaxClass}
          graph={graph}
          demoUi={demoUi}
          graphSurfaceKey={graphSurfaceKey}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          nodeTypes={nodeTypes}
          runId={runId}
          mode={mode}
          loading={loading}
          graphInteractiveReady={graphInteractiveReady}
          onGraphInteractiveSurfaceReady={handleGraphInteractiveSurfaceReady}
          controls={controls}
          leadIntro={leadIntro}
        />
      ) : null}
    </div>
  );
}
