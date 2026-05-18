"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { EmptyStateProps } from "@/components/EmptyState";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { SHOWCASE_PHI_FINDING_GRAPH_NODE_ID } from "@/lib/finding-inspect-graph-evidence";
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
import {
  SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
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
  const urlGraphNodeId = searchParams.get("graphNodeId")?.trim() ?? "";
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
  const defaultSelectedGraphNodeId =
    urlGraphNodeId.length > 0
      ? urlGraphNodeId
      : buyerPolishedShell &&
          canonicalizeDemoRunId(runId) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID)
        ? SHOWCASE_PHI_FINDING_GRAPH_NODE_ID
        : undefined;

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

    if (
      buyerPolishedShell &&
      (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled())
    ) {
      setRunId(SHOWCASE_STATIC_DEMO_RUN_ID);

      return;
    }

    const fromWorkspace = workspaceRun?.activeRunId?.trim() ?? "";

    if (fromWorkspace.length === 0) {
      return;
    }

    setRunId(fromWorkspace);
  }, [workspaceRun?.activeRunId, urlRunId, buyerPolishedShell]);

  useLayoutEffect(() => {
    setGraph(null);
  }, [runId]);

  const seededProvenanceGraphVm = useMemo((): GraphViewModel | null => {
    if (mode !== "provenance-full") {
      return null;
    }

    const rid = runId.trim();

    if (rid.length === 0) {
      return null;
    }

    const prov = tryStaticDemoProvenanceGraph(rid);

    if (prov === null) {
      return null;
    }

    return applyProvenanceDemoPresentationIfEligible(provenanceLinkageToGraphViewModel(prov), mode, rid);
  }, [mode, runId]);

  const effectiveGraph = graph ?? seededProvenanceGraphVm;

  const graphSurfaceKey = useMemo(() => {
    if (effectiveGraph === null) {
      return "";
    }

    return `${runId.trim()}-${effectiveGraph.nodes.length}-${effectiveGraph.edges.length}`;
  }, [effectiveGraph, runId]);

  useEffect(() => {
    if (graphSurfaceKey.length === 0) {
      setGraphInteractiveReady(false);

      return;
    }

    setGraphInteractiveReady(false);
  }, [graphSurfaceKey]);

  const nodeTypes = useMemo(() => {
    if (effectiveGraph === null) {
      return [];
    }

    const set = new Set(effectiveGraph.nodes.map((n) => n.type));

    return [...set].sort((a, b) => a.localeCompare(b));
  }, [effectiveGraph]);

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

  const showIdleCard =
    effectiveGraph === null && !loading && loadFailure === null && malformedMessage === null;

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

  const graphIdlePreset = useMemo((): EmptyStateProps => {
    if (demoUi && showIdleCard) {
      const manifestHref = `/manifests/${encodeURIComponent(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}`;
      const auditHref = `/audit?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

      return {
        ...GRAPH_IDLE,
        title: BUYER_SURFACE_VOCABULARY.evidenceGraph,
        description: `${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE} traces evidence from captured context through monitored risks to the signed manifest and deliverables. Choose Open signed manifest or Open audit trail if the canvas is taking longer than expected.`,
        actions: [
          { label: "Open signed manifest", href: manifestHref },
          { label: "Open audit trail", href: auditHref, variant: "outline" as const },
        ],
      };
    }

    return GRAPH_IDLE;
  }, [demoUi, showIdleCard]);

  const leadIntro =
    demoUi || buyerPolishedShell
      ? `Interactive ${BUYER_SURFACE_VOCABULARY.evidenceGraph.toLowerCase()} for the selected review. Shows reviewed context, policy basis, architecture analysis, prioritized findings, mitigation decisions, finalized signed manifest outputs, and deliverables for ${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE}.`
      : "Select a review, choose a graph mode, then load the graph. The preview includes decisions, findings, artifacts, review events, and architecture entities.";

  const pageTitle = buyerPolishedShell ? "Decision traceability graph" : BUYER_SURFACE_VOCABULARY.evidenceGraph;

  const loadButtonLabel = loading ? "Loading…" : "Load graph";

  const showLoadButton =
    !(demoUi && mode === "provenance-full") &&
    (!demoUi || mode !== "provenance-full" || effectiveGraph === null);

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
      <OperatorPageHeader
        title={pageTitle}
        helpKey="architecture-graph"
        buyerTitleHint={
          buyerPolishedShell
            ? "Use the canvas to open evidence, findings, decisions, and manifest outputs — detail appears in the side panel."
            : undefined
        }
      />
      {effectiveGraph === null ? (
        <GraphPageIntroParagraph demoUi={demoUi} buyerPolishedShell={buyerPolishedShell} leadIntro={leadIntro} />
      ) : null}

      {effectiveGraph === null ? controls : null}

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

      {effectiveGraph ? (
        <GraphLoadedExperience
          buyerPolishedShell={buyerPolishedShell}
          graphMainColumnMaxClass={graphMainColumnMaxClass}
          graph={effectiveGraph}
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
          defaultSelectedGraphNodeId={defaultSelectedGraphNodeId}
        />
      ) : null}
    </div>
  );
}
