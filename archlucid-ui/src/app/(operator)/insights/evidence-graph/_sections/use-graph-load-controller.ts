"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, startTransition } from "react";

import { useGraphPageFetch } from "@/app/(operator)/insights/evidence-graph/_sections/use-graph-page-fetch";
import {
  applyProvenanceDemoPresentationIfEligible,
  type GraphMode,
} from "@/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import {
  isStaticDemoPayloadFallbackActiveForRun,
  isStaticDemoPayloadFallbackEnabled,
  tryStaticDemoProvenanceGraph,
} from "@/lib/operator/operator-static-demo";
import { isSampleGraphActive, type AskRunListAvailability } from "@/lib/graph-page-state";
import { provenanceLinkageToGraphViewModel } from "@/lib/provenance-linkage-to-graph-vm";
import type { GraphViewModel } from "@/types/graph";

export type UseGraphLoadControllerInput = {
  readonly runId: string;
  readonly graphLoadRequested: boolean;
  readonly buyerPolishedShell: boolean;
};

export function useGraphLoadController(input: UseGraphLoadControllerInput) {
  const { runId, graphLoadRequested, buyerPolishedShell } = input;

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
  const [reviewsListLoadError, setReviewsListLoadError] = useState(false);
  const [reviewListAvailability, setReviewListAvailability] = useState<AskRunListAvailability>({
    loadError: false,
    loading: true,
    packageCount: 0,
    usingSyntheticSample: false,
  });

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

  useLayoutEffect(() => {
    setGraph(null);
  }, [runId, setGraph]);

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
  }, [runId, mode, graphLoadRequested, buyerPolishedShell, setGraph]);

  const demoUi =
    isBuyerPolishedOperatorShellEnv() ||
    isNextPublicDemoMode() ||
    isStaticDemoPayloadFallbackEnabled() ||
    isStaticDemoPayloadFallbackActiveForRun(runId.trim());

  return {
    decisionId,
    setDecisionId,
    nodeId,
    setNodeId,
    depth,
    setDepth,
    mode,
    setMode,
    typeFilter,
    setTypeFilter,
    handleTypeFilterChange,
    graphInteractiveReady,
    reviewsListLoadError,
    reviewListAvailability,
    graph,
    setGraph,
    loading,
    loadFailure,
    malformedMessage,
    architectureGraphNote,
    performGraphLoad,
    graphEndpointHint,
    handleGraphInteractiveSurfaceReady,
    handleReviewsListAvailabilityChange,
    effectiveGraph,
    sampleGraphActive,
    graphSurfaceKey,
    nodeTypes,
    demoUi,
  };
}

export type GraphLoadControllerState = ReturnType<typeof useGraphLoadController>;
