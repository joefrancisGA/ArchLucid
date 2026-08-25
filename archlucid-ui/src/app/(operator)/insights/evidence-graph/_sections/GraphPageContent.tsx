"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, startTransition } from "react";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorRelatedSurfacesDisclosure } from "@/components/operator/OperatorRelatedSurfacesDisclosure";
import { GraphPageVocabularyRails } from "@/app/(operator)/insights/evidence-graph/_sections/GraphPageVocabularyRails";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import type { EmptyStateProps } from "@/components/EmptyState";
import { EvidenceGraphFirstOpenCoach } from "@/components/EvidenceGraphFirstOpenCoach";
import { CtoDemoBuyerValueStrip } from "@/components/cto-demo/CtoDemoBuyerValueStrip";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { OPERATOR_GRAPH_PAGE_SUBTITLE } from "@/lib/buyer/buyer-polish-copy";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { cn } from "@/lib/utils";
import { OPERATOR_LAYOUT, OPERATOR_PAGE_CONTAINER } from "@/lib/design-tokens";
import {
  EVIDENCE_GRAPH_PAGE_SUBTITLE,
  EVIDENCE_GRAPH_PAGE_TITLE,
} from "@/lib/evidence-graph-page";
import {
  EVIDENCE_GRAPH_PRIMARY_CONTENT_ID,
  EVIDENCE_GRAPH_SKIP_LINK_LABEL,
} from "@/lib/evidence-graph-page-copy";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { SHOWCASE_PHI_FINDING_GRAPH_NODE_ID } from "@/lib/findings/finding-inspect-graph-evidence";
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
} from "@/lib/operator/operator-static-demo";
import {
  isSampleGraphActive,
  resolveGraphReviewPickerState,
  shouldShowBuyerEvidenceGraphLoadButton,
  shouldShowGraphIdleCard,
  type AskRunListAvailability,
} from "@/lib/graph-page-state";
import { GraphSampleModeBanner } from "@/app/(operator)/insights/evidence-graph/_sections/GraphSampleModeBanner";
import { coerceGraphViewModel } from "@/lib/operator/operator-response-guards";
import { provenanceLinkageToGraphViewModel } from "@/lib/provenance-linkage-to-graph-vm";
import {
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import type { GraphViewModel } from "@/types/graph";
import { GraphArchitectureNoteBanner } from "@/app/(operator)/insights/evidence-graph/_sections/GraphArchitectureNoteBanner";
import { GraphEvidenceTrailGuidanceDisclosure } from "@/app/(operator)/insights/evidence-graph/_sections/GraphEvidenceTrailGuidanceDisclosure";
import { GraphFetchStatusAlerts } from "@/app/(operator)/insights/evidence-graph/_sections/GraphFetchStatusAlerts";
import { GraphPickReviewBeforeCanvasStrip } from "@/app/(operator)/insights/evidence-graph/_sections/GraphPickReviewBeforeCanvasStrip";
import { EvidenceGraphNextReviewFooterClient } from "@/app/(operator)/insights/evidence-graph/_sections/EvidenceGraphNextReviewFooterClient";
import { GraphIdlePlaceholder } from "@/app/(operator)/insights/evidence-graph/_sections/GraphIdlePlaceholder";
import { GraphPageBuyerChrome } from "@/app/(operator)/insights/evidence-graph/_sections/GraphPageBuyerChrome";
import { GraphPageHeader } from "@/app/(operator)/insights/evidence-graph/_sections/GraphPageHeader";
import {
  applyProvenanceDemoPresentationIfEligible,
  buildGraphSavedViewPayload,
  resolveEvidenceTrailPresentationView,
  resolveGraphIdleEmptyPreset,
  type EvidenceTrailPresentationView,
  type GraphMode,
  type GraphSavedViewState,
} from "@/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers";
import { GraphLoadedExperience } from "@/app/(operator)/insights/evidence-graph/_sections/GraphLoadedExperience";
import { GraphModeAuxiliaryFields } from "@/app/(operator)/insights/evidence-graph/_sections/GraphModeAuxiliaryFields";
import { GraphPageControls } from "@/app/(operator)/insights/evidence-graph/_sections/GraphPageControls";
import { EvidenceTrailTracePanel } from "@/app/(operator)/insights/evidence-graph/_sections/EvidenceTrailTracePanel";
import { OperatorSavedViewsBar } from "@/components/operator/OperatorSavedViewsBar";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { OperatorSavedView } from "@/lib/api/operator-saved-views";
import type { GraphSavedViewFilters } from "@/lib/operator/operator-saved-view-types";

export function GraphPageContent() {
  const searchParams = useSearchParams();
  const urlRunId = searchParams.get("runId")?.trim() ?? "";
  const urlGraphNodeId = searchParams.get("graphNodeId")?.trim() ?? "";
  const urlPresentation = searchParams.get("presentation");
  const workspaceRun = useWorkspaceActiveRun();
  const [decisionId, setDecisionId] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [depth, setDepth] = useState(1);
  const [mode, setMode] = useState<GraphMode>("provenance-full");
  const [graph, setGraph] = useState<GraphViewModel | null>(null);
  const [loadFailure, setLoadFailure] = useState<ApiLoadFailureState | null>(null);
  const [malformedMessage, setMalformedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const handleTypeFilterChange = useCallback((value: string) => {
    startTransition(() => {
      setTypeFilter(value);
    });
  }, []);
  const [architectureGraphNote, setArchitectureGraphNote] = useState<string | null>(null);
  const [graphInteractiveReady, setGraphInteractiveReady] = useState(false);
  const [presentationView, setPresentationView] = useState<EvidenceTrailPresentationView>(() =>
    resolveEvidenceTrailPresentationView(urlPresentation, isBuyerPolishedOperatorShellEnv()),
  );
  const [reviewsListLoadError, setReviewsListLoadError] = useState(false);
  const [reviewListAvailability, setReviewListAvailability] = useState<AskRunListAvailability>({
    loadError: false,
    loading: true,
    packageCount: 0,
    usingSyntheticSample: false,
  });

  const loadGenRef = useRef(0);

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [runId, setRunId] = useState(() => {
    if (urlRunId.length > 0) {
      return urlRunId;
    }

    return "";
  });
  const [graphLoadRequested, setGraphLoadRequested] = useState(() => urlRunId.length > 0);
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
        return `/v1/evidence-graph/reviews/${rid}/decisions/${decisionId.trim() || "{decisionId}"}`;
      case "node-neighborhood":
        return `/v1/evidence-graph/reviews/${rid}/nodes/${nodeId.trim() || "{nodeId}"}/neighborhood`;
      case "architecture":
        return `/v1/evidence-graph/reviews/${rid}`;
      default:
        return `/v1/evidence-graph/reviews/${rid}`;
    }
  }, [decisionId, mode, nodeId, runId]);

  const handleGraphInteractiveSurfaceReady = useCallback(() => {
    setGraphInteractiveReady(true);
  }, []);

  const handleReviewsListAvailabilityChange = useCallback((availability: AskRunListAvailability) => {
    setReviewsListLoadError(availability.loadError);
    setReviewListAvailability(availability);
  }, []);

  const handleRunIdChange = useCallback((value: string) => {
    setRunId(value);

    if (value.trim().length > 0) {
      setGraphLoadRequested(true);
      return;
    }

    setGraphLoadRequested(false);
    setGraph(null);
  }, []);

  useEffect(() => {
    if (urlRunId.length === 0) {
      return;
    }

    setRunId(urlRunId);
    setGraphLoadRequested(true);
  }, [urlRunId]);

  useEffect(() => {
    setPresentationView(
      resolveEvidenceTrailPresentationView(urlPresentation, isBuyerPolishedOperatorShellEnv()),
    );
  }, [urlPresentation]);

  useEffect(() => {
    if (urlRunId.length > 0) {
      return;
    }

    if (buyerPolishedShell) {
      return;
    }

    if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled()) {
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
  const sampleGraphActive = isSampleGraphActive({
    runId,
    graph,
    seededProvenanceGraphVm,
  });
  const reviewPickerState = resolveGraphReviewPickerState(reviewListAvailability, runId);

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
    if (buyerPolishedShell && !graphLoadRequested) {
      return;
    }

    const rid = runId.trim();

    if (rid.length === 0) {
      return;
    }

    if (mode !== "provenance-full") {
      return;
    }

    void performRef.current();
  }, [runId, mode, graphLoadRequested, buyerPolishedShell]);

  useEffect(() => {
    if (buyerPolishedShell && !graphLoadRequested) {
      return;
    }

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
  }, [runId, mode, graphLoadRequested, buyerPolishedShell]);

  const demoUi =
    isBuyerPolishedOperatorShellEnv() ||
    isNextPublicDemoMode() ||
    isStaticDemoPayloadFallbackEnabled() ||
    isStaticDemoPayloadFallbackActiveForRun(runId.trim());

  const buyerTraceWithoutGraph =
    buyerPolishedShell &&
    graphLoadRequested &&
    presentationView === "trace" &&
    effectiveGraph === null &&
    runId.trim().length > 0 &&
    !loading &&
    loadFailure === null &&
    malformedMessage === null;

  const buyerGraphAwaitingSelection =
    buyerPolishedShell && (runId.trim().length === 0 || !graphLoadRequested);

  const showOperatorControls = buyerPolishedShell || demoUi || runId.trim().length > 0;

  const showIdleCard = shouldShowGraphIdleCard({
    effectiveGraph,
    loading,
    loadFailure,
    malformedMessage,
    buyerGraphAwaitingSelection,
    buyerTraceWithoutGraph,
    reviewsListLoadError,
  });

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
        awaitingSelection: reviewPickerState === "no-selection",
      }),
    [buyerPolishedShell, demoUi, reviewPickerState, showIdleCard],
  );

  const pageTitle = buyerPolishedShell ? EVIDENCE_GRAPH_PAGE_TITLE : BUYER_SURFACE_VOCABULARY.evidenceGraph;
  const pageSubtitle = buyerPolishedShell ? EVIDENCE_GRAPH_PAGE_SUBTITLE : OPERATOR_GRAPH_PAGE_SUBTITLE;

  const loadButtonLabel = buyerPolishedShell
    ? loading
      ? "Loading…"
      : "Load evidence graph"
    : loading
      ? "Loading…"
      : "Load graph";

  const showLoadButton = buyerPolishedShell
    ? shouldShowBuyerEvidenceGraphLoadButton({
        reviewPickerState,
        runId,
        graphLoadRequested,
        effectiveGraph,
        loading,
        loadFailure,
      })
    : !(demoUi && mode === "provenance-full") &&
      (!demoUi || mode !== "provenance-full" || effectiveGraph === null);

  const buyerEmptyWorkspaceFocus =
    buyerPolishedShell && showIdleCard && reviewPickerState === "no-packages";

  const showReviewPickerBeforeCanvas = runId.trim().length === 0;

  const showSavedViews =
    canMutateEnterpriseShell &&
    !buyerPolishedShell &&
    !demoUi &&
    effectiveGraph !== null;

  const showLoadFailureAlert =
    !reviewsListLoadError &&
    loadFailure !== null &&
    effectiveGraph === null &&
    (!buyerPolishedShell || graphLoadRequested);

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

  const showBuyerPresentationTabs =
    buyerPolishedShell && !showIdleCard && (effectiveGraph !== null || graphLoadRequested);

  const controls = (
    <GraphPageControls
      graphMainColumnMaxClass={graphMainColumnMaxClass}
      runId={runId}
      onRunIdChange={handleRunIdChange}
      mode={mode}
      onModeChange={setMode}
      demoUi={demoUi}
      buyerPolishedShell={buyerPolishedShell}
      showLoadButton={showLoadButton}
      loadButtonLabel={loadButtonLabel}
      loading={loading}
      onLoadGraph={() => {
        setGraphLoadRequested(true);
        void performGraphLoad();
      }}
      decisionId={decisionId}
      nodeId={nodeId}
      onReviewsListAvailabilityChange={handleReviewsListAvailabilityChange}
      reviewPickerState={reviewPickerState}
      sampleGraphActive={sampleGraphActive}
      showPresentationTabs={showBuyerPresentationTabs}
      compactEmptyWorkspace={buyerEmptyWorkspaceFocus}
    />
  );

  const buyerIdlePlaceholder = showIdleCard ? (
    <GraphIdlePlaceholder
      graphIdlePreset={graphIdlePreset}
      buyerPolishedShell={buyerPolishedShell}
      className={graphMainColumnMaxClass}
      prioritize={buyerEmptyWorkspaceFocus}
    />
  ) : null;

  const buyerTraceOnlyIdle = buyerTraceWithoutGraph;

  const buyerGraphBody =
    buyerPolishedShell && showOperatorControls ? (
      <Tabs
        value={presentationView}
        onValueChange={(next) => {
          setPresentationView(next as EvidenceTrailPresentationView);
        }}
      >
        {buyerEmptyWorkspaceFocus ? (
          <div className={cn(graphMainColumnMaxClass, OPERATOR_LAYOUT.sectionHeadingStack)}>
            {buyerIdlePlaceholder}
            {controls}
          </div>
        ) : (
          <>
            {controls}
            {buyerIdlePlaceholder}
          </>
        )}
        <GraphFetchStatusAlerts
          loading={loading}
          loadFailure={showLoadFailureAlert ? loadFailure : null}
          malformedMessage={malformedMessage}
          buyerPolishedShell={buyerPolishedShell}
          runId={runId}
          onRetry={() => {
            setGraphLoadRequested(true);
            void performGraphLoad();
          }}
          graphEndpointHint={graphEndpointHint}
        />
        {sampleGraphActive && effectiveGraph !== null ? (
          <GraphSampleModeBanner
            className={graphMainColumnMaxClass}
            showUseMyReviewAction={reviewListAvailability.packageCount > 0}
            compact
          />
        ) : null}
        <TabsContent value="trace" className="pt-0" data-testid="graph-presentation-panel-trace">
          {buyerTraceOnlyIdle ? (
            <div className={graphMainColumnMaxClass}>
              <EvidenceTrailTracePanel runId={runId} onOpenGraphView={() => setPresentationView("graph")} />
            </div>
          ) : null}
        </TabsContent>
        {architectureGraphNote ? (
          <GraphArchitectureNoteBanner
            graphMainColumnMaxClass={graphMainColumnMaxClass}
            architectureGraphNote={architectureGraphNote}
          />
        ) : null}
        {effectiveGraph ? (
          <GraphLoadedExperience
            buyerPolishedShell={buyerPolishedShell}
            graphMainColumnMaxClass={graphMainColumnMaxClass}
            graph={effectiveGraph}
            demoUi={demoUi}
            graphSurfaceKey={graphSurfaceKey}
            typeFilter={typeFilter}
            onTypeFilterChange={handleTypeFilterChange}
            nodeTypes={nodeTypes}
            runId={runId}
            mode={mode}
            onModeChange={setMode}
            loading={loading}
            graphInteractiveReady={graphInteractiveReady}
            onGraphInteractiveSurfaceReady={handleGraphInteractiveSurfaceReady}
            controls={controls}
            defaultSelectedGraphNodeId={defaultSelectedGraphNodeId}
            presentationView={presentationView}
            onPresentationViewChange={setPresentationView}
            sampleGraphActive={sampleGraphActive}
          />
        ) : null}
      </Tabs>
    ) : null;

  return (
    <OperatorPageContainer variant="dashboard">
      {buyerPolishedShell ? null : (
        <CtoDemoBuyerValueStrip stepIndex={2} />
      )}
      <a
        href={`#${EVIDENCE_GRAPH_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {EVIDENCE_GRAPH_SKIP_LINK_LABEL}
      </a>
      <GraphPageHeader title={pageTitle} subtitle={pageSubtitle} />
      <div
        id={EVIDENCE_GRAPH_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
        data-testid="evidence-graph-primary-content"
      >
      {!buyerPolishedShell ? (
        <>
          <OperatorRelatedSurfacesDisclosure testId="evidence-graph-related-surfaces-disclosure">
            <GraphPageVocabularyRails />
          </OperatorRelatedSurfacesDisclosure>
          <EvidenceGraphFirstOpenCoach />
        </>
      ) : null}
      <GraphEvidenceTrailGuidanceDisclosure className={buyerPolishedShell ? "hidden" : undefined} />
      {buyerGraphBody}
      {!buyerPolishedShell && showOperatorControls && effectiveGraph === null ? (
        <>
          {savedViewsBar}
          {controls}
        </>
      ) : null}

      {!buyerPolishedShell && runId.trim().length > 0 ? (
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
      ) : null}

      {!buyerPolishedShell ? (
        <GraphFetchStatusAlerts
          loading={loading}
          loadFailure={showLoadFailureAlert ? loadFailure : null}
          malformedMessage={malformedMessage}
          buyerPolishedShell={buyerPolishedShell}
          runId={runId}
          onRetry={() => {
            setGraphLoadRequested(true);
            void performGraphLoad();
          }}
          graphEndpointHint={graphEndpointHint}
        />
      ) : null}

      {!buyerPolishedShell && showReviewPickerBeforeCanvas ? (
        <GraphPickReviewBeforeCanvasStrip selectedReviewId={runId} onSelectReview={handleRunIdChange} />
      ) : null}

      {!buyerPolishedShell && showIdleCard && !showReviewPickerBeforeCanvas ? (
        <GraphIdlePlaceholder graphIdlePreset={graphIdlePreset} buyerPolishedShell={buyerPolishedShell} />
      ) : null}

      {!buyerPolishedShell && architectureGraphNote ? (
        <GraphArchitectureNoteBanner graphMainColumnMaxClass={graphMainColumnMaxClass} architectureGraphNote={architectureGraphNote} />
      ) : null}

      {!buyerPolishedShell && effectiveGraph && runId.trim().length > 0 ? (
        <>
          {savedViewsBar}
          <GraphLoadedExperience
            buyerPolishedShell={buyerPolishedShell}
            graphMainColumnMaxClass={graphMainColumnMaxClass}
            graph={effectiveGraph}
            demoUi={demoUi}
            graphSurfaceKey={graphSurfaceKey}
            typeFilter={typeFilter}
            onTypeFilterChange={handleTypeFilterChange}
            nodeTypes={nodeTypes}
            runId={runId}
            mode={mode}
            onModeChange={setMode}
            loading={loading}
            graphInteractiveReady={graphInteractiveReady}
            onGraphInteractiveSurfaceReady={handleGraphInteractiveSurfaceReady}
            controls={controls}
            defaultSelectedGraphNodeId={defaultSelectedGraphNodeId}
            presentationView={presentationView}
            onPresentationViewChange={setPresentationView}
            sampleGraphActive={sampleGraphActive}
          />
        </>
      ) : null}
      {buyerPolishedShell ? <GraphPageBuyerChrome /> : null}
      {runId.trim().length > 0 ? <EvidenceGraphNextReviewFooterClient runId={runId} /> : null}
      </div>
    </OperatorPageContainer>
  );
}
