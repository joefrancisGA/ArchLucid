"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import type { EmptyStateProps } from "@/components/EmptyState";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { CtoDemoBuyerValueStrip } from "@/components/cto-demo/CtoDemoBuyerValueStrip";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { BUYER_EVIDENCE_TRAIL_PAGE_SUBTITLE, BUYER_EVIDENCE_TRAIL_PAGE_TITLE, BUYER_GRAPH_PAGE_LEAD } from "@/lib/buyer-polish-copy";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { OPERATOR_PAGE_CONTAINER } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { SHOWCASE_PHI_FINDING_GRAPH_NODE_ID } from "@/lib/finding-inspect-graph-evidence";
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
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import type { GraphViewModel } from "@/types/graph";
import { GraphArchitectureNoteBanner } from "@/app/(operator)/graph/_sections/GraphArchitectureNoteBanner";
import { GraphEvidenceTrailGuidanceDisclosure } from "@/app/(operator)/graph/_sections/GraphEvidenceTrailGuidanceDisclosure";
import { GraphFetchStatusAlerts } from "@/app/(operator)/graph/_sections/GraphFetchStatusAlerts";
import { GraphIdlePlaceholder } from "@/app/(operator)/graph/_sections/GraphIdlePlaceholder";
import {
  applyProvenanceDemoPresentationIfEligible,
  buildGraphSavedViewPayload,
  resolveGraphIdleEmptyPreset,
  type EvidenceTrailPresentationView,
  type GraphMode,
  type GraphSavedViewState,
} from "@/app/(operator)/graph/_sections/graph-page-helpers";
import { GraphLoadedExperience } from "@/app/(operator)/graph/_sections/GraphLoadedExperience";
import { GraphModeAuxiliaryFields } from "@/app/(operator)/graph/_sections/GraphModeAuxiliaryFields";
import { GraphPageControls } from "@/app/(operator)/graph/_sections/GraphPageControls";
import { GraphPageIntroParagraph } from "@/app/(operator)/graph/_sections/GraphPageIntroParagraph";
import { EvidenceTrailTracePanel } from "@/app/(operator)/graph/_sections/EvidenceTrailTracePanel";
import { OperatorSavedViewsBar } from "@/components/OperatorSavedViewsBar";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import type { OperatorSavedView } from "@/lib/api/operator-saved-views";
import type { GraphSavedViewFilters } from "@/lib/operator-saved-view-types";

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
  const [presentationView, setPresentationView] = useState<EvidenceTrailPresentationView>("trace");

  const loadGenRef = useRef(0);

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const canMutateEnterpriseShell = useOperateCapability();
  const graphMainColumnMaxClass = buyerPolishedShell
    ? OPERATOR_PAGE_CONTAINER.variant.dashboard
    : OPERATOR_PAGE_CONTAINER.variant.workflow;
  const defaultSelectedGraphNodeId =
    urlGraphNodeId.length > 0
      ? urlGraphNodeId
      : buyerPolishedShell &&
          canonicalizeDemoRunId(runId) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID)
        ? SHOWCASE_PHI_FINDING_GRAPH_NODE_ID
        : undefined;

  const graphEndpointHint = useMemo((): string => {
    const rid = runId.trim();

    if (rid.length === 0) {
      return "";
    }

    switch (mode) {
      case "provenance-full":
        return `/v1/provenance/runs/${rid}/graph`;
      case "decision-subgraph":
        return `/v1/graph/runs/${rid}/decisions/${decisionId.trim() || "{decisionId}"}`;
      case "node-neighborhood":
        return `/v1/graph/runs/${rid}/nodes/${nodeId.trim() || "{nodeId}"}/neighborhood`;
      case "architecture":
        return `/v1/graph/runs/${rid}`;
      default:
        return `/v1/graph/runs/${rid}`;
    }
  }, [decisionId, mode, nodeId, runId]);

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

  const performGraphLoad = useCallback(async (override?: Partial<GraphSavedViewState>) => {
    const effectiveRunId = override?.runId ?? runId;
    const effectiveMode = override?.mode ?? mode;
    const effectiveDecisionId = override?.decisionId ?? decisionId;
    const effectiveNodeId = override?.nodeId ?? nodeId;
    const effectiveDepth = override?.depth ?? depth;
    const effectiveTypeFilter = override?.typeFilter ?? typeFilter;
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

      if (effectiveMode !== "provenance-full") {
        return;
      }

      const rid = effectiveRunId.trim();
      const prov = tryStaticDemoProvenanceGraph(rid);

      if (prov === null) {
        return;
      }

      setLoadFailure(null);
      setMalformedMessage(null);
      setGraph(
        applyProvenanceDemoPresentationIfEligible(provenanceLinkageToGraphViewModel(prov), effectiveMode, rid),
      );
      setTypeFilter(effectiveTypeFilter);
    };

    try {
      let raw: unknown;

      switch (effectiveMode) {
        case "provenance-full":
          raw = await getProvenanceGraph(effectiveRunId);
          break;
        case "decision-subgraph":
          raw = await getDecisionSubgraph(effectiveRunId, effectiveDecisionId);
          break;
        case "node-neighborhood":
          raw = await getNodeNeighborhood(effectiveRunId, effectiveNodeId, effectiveDepth);
          break;
        case "architecture":
          try {
            raw = await getArchitectureGraph(effectiveRunId);
          } catch (err) {
            const rid = effectiveRunId.trim();

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

      if (effectiveMode === "provenance-full" && nextGraph.nodes.length === 0 && nextGraph.edges.length === 0) {
        const prov = tryStaticDemoProvenanceGraph(effectiveRunId.trim());

        if (prov !== null) {
          nextGraph = provenanceLinkageToGraphViewModel(prov);
        }
      }

      setGraph(applyProvenanceDemoPresentationIfEligible(nextGraph, effectiveMode, effectiveRunId.trim()));
      setTypeFilter(effectiveTypeFilter);

      if (effectiveMode !== "architecture") {
        setArchitectureGraphNote(null);
      }
    } catch (err) {
      if (gen !== loadGenRef.current) {
        return;
      }

      setLoadFailure(toApiLoadFailure(err));
      setGraph(null);
      tryStaticProvenance();

      if (gen === loadGenRef.current && effectiveMode === "provenance-full") {
        const rid = effectiveRunId.trim();
        const prov = tryStaticDemoProvenanceGraph(rid);

        if (prov !== null) {
          setLoadFailure(null);
        }
      }
    } finally {
      if (gen === loadGenRef.current) {
        setLoading(false);
      }
    }
  }, [buyerPolishedShell, decisionId, depth, mode, nodeId, runId, typeFilter]);

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

  const demoUi =
    isBuyerPolishedOperatorShellEnv() ||
    isNextPublicDemoMode() ||
    isStaticDemoPayloadFallbackEnabled() ||
    isStaticDemoPayloadFallbackActiveForRun(runId.trim());

  const buyerTraceWithoutGraph =
    buyerPolishedShell &&
    presentationView === "trace" &&
    effectiveGraph === null &&
    runId.trim().length > 0 &&
    !loading &&
    loadFailure === null &&
    malformedMessage === null;

  const showIdleCard =
    effectiveGraph === null &&
    !loading &&
    loadFailure === null &&
    malformedMessage === null &&
    !buyerTraceWithoutGraph;

  useEffect(() => {
    if (!demoUi && !buyerPolishedShell) {
      return;
    }

    setMode("provenance-full");
  }, [buyerPolishedShell, demoUi]);

  const graphIdlePreset = useMemo(
    (): EmptyStateProps =>
      resolveGraphIdleEmptyPreset({
        buyerPolished: buyerPolishedShell,
        demoUi,
        showIdleCard,
      }),
    [buyerPolishedShell, demoUi, showIdleCard],
  );

  const leadIntro =
    buyerPolishedShell
      ? BUYER_GRAPH_PAGE_LEAD
      : demoUi
        ? `Interactive ${BUYER_SURFACE_VOCABULARY.evidenceGraph.toLowerCase()} for the selected review. Shows reviewed context, policy basis, architecture analysis, prioritized findings, mitigation decisions, finalized signed manifest outputs, and deliverables for ${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE}.`
        : "Select a review, choose a graph mode, then load the graph. The preview includes decisions, findings, artifacts, review events, and architecture entities.";

  const pageTitle = buyerPolishedShell ? BUYER_EVIDENCE_TRAIL_PAGE_TITLE : BUYER_SURFACE_VOCABULARY.evidenceGraph;

  const loadButtonLabel = buyerPolishedShell
    ? loading
      ? "Loading…"
      : "Load evidence trail"
    : loading
      ? "Loading…"
      : "Load graph";

  const showLoadButton =
    !(demoUi && mode === "provenance-full") &&
    (!demoUi || mode !== "provenance-full" || effectiveGraph === null);

  const showSavedViews =
    canMutateEnterpriseShell &&
    !buyerPolishedShell &&
    !demoUi &&
    effectiveGraph !== null;

  const showLoadFailureAlert = loadFailure !== null && effectiveGraph === null;

  const getGraphSavedViewPayload = useCallback(
    () =>
      buildGraphSavedViewPayload({
        runId,
        mode,
        decisionId,
        nodeId,
        depth,
        typeFilter,
      }),
    [decisionId, depth, mode, nodeId, runId, typeFilter],
  );

  const loadGraphSavedView = useCallback(
    async (view: OperatorSavedView) => {
      const filters = view.payload.filters as GraphSavedViewFilters;
      const nextState: GraphSavedViewState = {
        runId: filters.runId ?? runId,
        mode: filters.mode ?? mode,
        decisionId: filters.decisionId ?? decisionId,
        nodeId: filters.nodeId ?? nodeId,
        depth: filters.depth ?? depth,
        typeFilter: filters.typeFilter ?? typeFilter,
      };

      setRunId(nextState.runId);
      setMode(nextState.mode);
      setDecisionId(nextState.decisionId);
      setNodeId(nextState.nodeId);
      setDepth(nextState.depth);
      setTypeFilter(nextState.typeFilter);
      await performGraphLoad(nextState);
    },
    [decisionId, depth, mode, nodeId, performGraphLoad, runId, typeFilter],
  );

  const savedViewsBar =
    showSavedViews ? (
      <OperatorSavedViewsBar
        surface="graph"
        disabled={loading}
        className={graphMainColumnMaxClass}
        getCurrentPayload={getGraphSavedViewPayload}
        onLoadView={loadGraphSavedView}
      />
    ) : null;

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
      onLoadGraph={() => void performGraphLoad()}
      decisionId={decisionId}
      nodeId={nodeId}
      presentationView={presentationView}
      onPresentationViewChange={setPresentationView}
    />
  );

  const buyerTraceOnlyIdle = buyerTraceWithoutGraph;

  return (
    <OperatorPageContainer variant="dashboard">
      {buyerPolishedShell ? <GraphEvidenceTrailGuidanceDisclosure /> : <LayerHeader pageKey="graph" />}
      <CtoDemoBuyerValueStrip stepIndex={2} />
      <OperatorPageHeader
        title={pageTitle}
        subtitle={
          buyerPolishedShell
            ? `${BUYER_EVIDENCE_TRAIL_PAGE_SUBTITLE} This graph links your architecture inputs, pipeline steps, findings, and the signed manifest.`
            : "Evidence graph shows provenance or an architecture-oriented view for one review. Pick a review and mode, then load or refresh."
        }
      />
      {effectiveGraph === null && !buyerPolishedShell ? (
        <GraphPageIntroParagraph demoUi={demoUi} buyerPolishedShell={buyerPolishedShell} leadIntro={leadIntro} />
      ) : null}

      {buyerPolishedShell || effectiveGraph === null ? (
        <>
          {savedViewsBar}
          {controls}
        </>
      ) : null}

      {buyerPolishedShell ? null : (
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
      )}

      <GraphFetchStatusAlerts
        loading={loading}
        loadFailure={showLoadFailureAlert ? loadFailure : null}
        malformedMessage={malformedMessage}
        buyerPolishedShell={buyerPolishedShell}
        runId={runId}
        onRetry={() => void performGraphLoad()}
        graphEndpointHint={graphEndpointHint}
      />

      {showIdleCard ? (
        <GraphIdlePlaceholder graphIdlePreset={graphIdlePreset} buyerPolishedShell={buyerPolishedShell} />
      ) : null}

      {buyerTraceOnlyIdle ? (
        <div className={graphMainColumnMaxClass}>
          <EvidenceTrailTracePanel runId={runId} onOpenGraphView={() => setPresentationView("graph")} />
        </div>
      ) : null}

      {architectureGraphNote && (
        <GraphArchitectureNoteBanner graphMainColumnMaxClass={graphMainColumnMaxClass} architectureGraphNote={architectureGraphNote} />
      )}

      {effectiveGraph ? (
        <>
          {savedViewsBar}
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
          presentationView={presentationView}
          onPresentationViewChange={setPresentationView}
        />
        </>
      ) : null}
    </OperatorPageContainer>
  );
}
