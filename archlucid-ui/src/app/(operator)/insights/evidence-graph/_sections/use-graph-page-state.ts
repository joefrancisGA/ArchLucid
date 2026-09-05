"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, startTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { getRunDetail } from "@/lib/api";
import { coerceRunDetail } from "@/lib/operator/operator-response-guards";

import { useGraphPageUrlState } from "@/app/(operator)/insights/evidence-graph/_sections/use-graph-page-url-state";
import { useGraphPageFetch } from "@/app/(operator)/insights/evidence-graph/_sections/use-graph-page-fetch";
import { useGraphPageBuyerShell } from "@/app/(operator)/insights/evidence-graph/_sections/use-graph-page-buyer-shell";
import { useGraphPageEffectiveGraph } from "@/app/(operator)/insights/evidence-graph/_sections/use-graph-page-effective-graph";
import { useGraphPageSavedViews } from "@/app/(operator)/insights/evidence-graph/_sections/use-graph-page-saved-views";
import {
  resolveEvidenceTrailPresentationView,
  type EvidenceTrailPresentationView,
  type GraphMode,
} from "@/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import type { AskRunListAvailability } from "@/lib/graph-page-state";
import { graphPresentationViewHrefFromSearch } from "@/lib/insights/graph-presentation-view-url";
import { graphRunIdHrefFromSearch } from "@/lib/insights/graph-run-id-url";
import { graphLoadRequestedHrefFromSearch } from "@/lib/insights/graph-load-requested-url";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";

export function useGraphPageState() {
  const router = useRouter();
  const pathname = usePathname() ?? EVIDENCE_GRAPH_PATH;
  const searchParams = useSearchParams();
  const { isWorkingMode, mounted: workspaceMounted } = useWorkspaceMode();
  const workingMode = workspaceMounted && isWorkingMode;
  const [decisionId, setDecisionId] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [depth, setDepth] = useState(1);
  const [mode, setMode] = useState<GraphMode>("provenance-full");
  const [typeFilter, setTypeFilter] = useState("");
  const handleTypeFilterChange = useCallback((value: string) => {
    startTransition(() => {
      setTypeFilter(value);
    });
  }, []);
  const [graphInteractiveReady, setGraphInteractiveReady] = useState(false);
  const productionEvalChrome = useProductionEvalChrome();
  const [presentationView, setPresentationView] = useState<EvidenceTrailPresentationView>(() =>
    resolveEvidenceTrailPresentationView(null, productionEvalChrome, workingMode),
  );
  const [reviewsListLoadError, setReviewsListLoadError] = useState(false);
  const [reviewListAvailability, setReviewListAvailability] = useState<AskRunListAvailability>({
    loadError: false,
    loading: true,
    packageCount: 0,
    usingSyntheticSample: false,
  });

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [runId, setRunId] = useState("");
  const [sealedManifestVersionForExport, setSealedManifestVersionForExport] = useState<string | null>(null);
  const [graphLoadRequested, setGraphLoadRequestedState] = useState(false);
  const { urlRunId, urlGraphNodeId } = useGraphPageUrlState({
    setRunId,
    setGraphLoadRequested: setGraphLoadRequestedState,
    setPresentationView,
    setMode,
    setTypeFilter,
    setDepth,
    setNodeId,
    setDecisionId,
  });

  const setGraphLoadRequested = useCallback(
    (requested: boolean) => {
      setGraphLoadRequestedState(requested);
      router.replace(graphLoadRequestedHrefFromSearch(searchParams.toString(), requested, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const {
    graph,
    setGraph,
    loading,
    loadFailure,
    malformedMessage,
    architectureGraphNote,
    performGraphLoad,
  } = useGraphPageFetch({
    runId,
    mode,
    decisionId,
    nodeId,
    depth,
    typeFilter,
    buyerPolishedShell,
    setTypeFilter,
    setGraphInteractiveReady,
  });

  const {
    effectiveGraph,
    sampleGraphActive,
    demoUi,
    defaultSelectedGraphNodeId,
  } = useGraphPageEffectiveGraph({
    runId,
    mode,
    graph,
    buyerPolishedShell,
    graphLoadRequested,
    urlGraphNodeId,
    setGraph,
  });

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

  const handlePresentationViewChange = useCallback(
    (next: EvidenceTrailPresentationView) => {
      setPresentationView(next);
      router.replace(graphPresentationViewHrefFromSearch(searchParams.toString(), next, pathname), { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleRunIdChange = useCallback(
    (value: string) => {
      setRunId(value);

      if (value.trim().length > 0) {
        setGraphLoadRequested(true);
      } else {
        setGraphLoadRequested(false);
        setGraph(null);
      }
    },
    [setGraph, setGraphLoadRequested],
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextHref = graphRunIdHrefFromSearch(searchParams.toString(), runId, pathname);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [pathname, router, runId, searchParams]);

  useLayoutEffect(() => {
    setGraph(null);
  }, [runId, setGraph]);

  useEffect(() => {
    const rid = runId.trim();

    if (rid.length === 0) {
      setSealedManifestVersionForExport(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const envelope = await getRunDetail(rid);
        const coerced = coerceRunDetail(envelope.data);

        if (cancelled) {
          return;
        }

        if (!coerced.ok) {
          setSealedManifestVersionForExport(null);
          return;
        }

        const runWire = coerced.value.run as { goldenManifestId?: string | null };
        const manifestId =
          typeof runWire.goldenManifestId === "string" ? runWire.goldenManifestId.trim() : "";

        setSealedManifestVersionForExport(manifestId.length > 0 ? manifestId : null);
      } catch {
        if (!cancelled) {
          setSealedManifestVersionForExport(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [runId]);

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

  const buyerShell = useGraphPageBuyerShell({
    runId,
    graphLoadRequested,
    effectiveGraph,
    loading,
    loadFailure,
    malformedMessage,
    reviewsListLoadError,
    reviewListAvailability,
    demoUi,
    mode,
    setMode,
    graphInteractiveReady,
    presentationView,
  });

  const savedViews = useGraphPageSavedViews({
    runId,
    mode,
    decisionId,
    nodeId,
    depth,
    typeFilter,
    buyerPolishedShell,
    demoUi,
    effectiveGraph,
    setRunId,
    setMode,
    setDecisionId,
    setNodeId,
    setDepth,
    setTypeFilter,
    performGraphLoad,
  });

  return {
    buyerPolishedShell,
    pageTitle: buyerShell.pageTitle,
    pageSubtitle: buyerShell.pageSubtitle,
    showOperatorControls: buyerShell.showOperatorControls,
    showReviewPickerBeforeCanvas: buyerShell.showReviewPickerBeforeCanvas,
    runId,
    sealedManifestVersionForExport,
    handleRunIdChange,
    graphInspectSteps: buyerShell.graphInspectSteps,
    graphInspectEmphasizedStepId: buyerShell.graphInspectEmphasizedStepId,
    showIdleCard: buyerShell.showIdleCard,
    graphIdlePreset: buyerShell.graphIdlePreset,
    architectureGraphNote,
    graphMainColumnMaxClass: buyerShell.graphMainColumnMaxClass,
    effectiveGraph,
    demoUi,
    graphSurfaceKey,
    typeFilter,
    handleTypeFilterChange,
    nodeTypes,
    mode,
    setMode,
    loading,
    graphInteractiveReady,
    handleGraphInteractiveSurfaceReady,
    defaultSelectedGraphNodeId,
    presentationView,
    setPresentationView: handlePresentationViewChange,
    sampleGraphActive,
    showLoadFailureAlert: buyerShell.showLoadFailureAlert,
    loadFailure,
    malformedMessage,
    performGraphLoad,
    graphLoadRequested,
    setGraphLoadRequested,
    graphEndpointHint,
    decisionId,
    setDecisionId,
    nodeId,
    setNodeId,
    depth,
    setDepth,
    reviewPickerState: buyerShell.reviewPickerState,
    reviewListAvailability,
    handleReviewsListAvailabilityChange,
    loadButtonLabel: buyerShell.loadButtonLabel,
    showLoadButton: buyerShell.showLoadButton,
    buyerEmptyWorkspaceFocus: buyerShell.buyerEmptyWorkspaceFocus,
    buyerTraceWithoutGraph: buyerShell.buyerTraceWithoutGraph,
    showSavedViews: savedViews.showSavedViews,
    getGraphSavedViewPayload: savedViews.getGraphSavedViewPayload,
    loadGraphSavedView: savedViews.loadGraphSavedView,
    workingMode,
  };
}

export type GraphPageState = ReturnType<typeof useGraphPageState>;
