"use client";

import { useCallback, useState } from "react";

import { useGraphPageUrlState } from "@/app/(operator)/insights/evidence-graph/_sections/use-graph-page-url-state";
import { useGraphLoadController } from "@/app/(operator)/insights/evidence-graph/_sections/use-graph-load-controller";
import { useGraphSavedViews } from "@/app/(operator)/insights/evidence-graph/_sections/use-graph-saved-views";
import { useGraphPageBuyerShell } from "@/app/(operator)/insights/evidence-graph/_sections/use-graph-page-buyer-shell";
import {
  resolveEvidenceTrailPresentationView,
} from "@/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { SHOWCASE_PHI_FINDING_GRAPH_NODE_ID } from "@/lib/findings/finding-inspect-graph-evidence";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { useOperateCapability } from "@/hooks/use-operate-capability";

export function useGraphPageState() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [runId, setRunId] = useState("");
  const [graphLoadRequested, setGraphLoadRequested] = useState(false);
  const [presentationView, setPresentationView] = useState(() =>
    resolveEvidenceTrailPresentationView(null, buyerPolishedShell),
  );

  const { urlRunId, urlGraphNodeId } = useGraphPageUrlState({
    setRunId,
    setGraphLoadRequested,
    setPresentationView,
    setMode: loadController.setMode,
  });
  const canMutateEnterpriseShell = useOperateCapability();

  const defaultSelectedGraphNodeId =
    urlGraphNodeId.length > 0
      ? urlGraphNodeId
      : buyerPolishedShell &&
          canonicalizeDemoRunId(runId) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID)
        ? SHOWCASE_PHI_FINDING_GRAPH_NODE_ID
        : undefined;

  const loadController = useGraphLoadController({
    runId,
    graphLoadRequested,
    buyerPolishedShell,
  });

  const buyerShell = useGraphPageBuyerShell({
    runId,
    graphLoadRequested,
    effectiveGraph: loadController.effectiveGraph,
    loading: loadController.loading,
    loadFailure: loadController.loadFailure,
    malformedMessage: loadController.malformedMessage,
    reviewsListLoadError: loadController.reviewsListLoadError,
    reviewListAvailability: loadController.reviewListAvailability,
    demoUi: loadController.demoUi,
    mode: loadController.mode,
    setMode: loadController.setMode,
    graphInteractiveReady: loadController.graphInteractiveReady,
    presentationView,
  });

  const savedViews = useGraphSavedViews({
    runId,
    mode: loadController.mode,
    decisionId: loadController.decisionId,
    nodeId: loadController.nodeId,
    depth: loadController.depth,
    typeFilter: loadController.typeFilter,
    setRunId,
    setMode: loadController.setMode,
    setDecisionId: loadController.setDecisionId,
    setNodeId: loadController.setNodeId,
    setDepth: loadController.setDepth,
    setTypeFilter: loadController.setTypeFilter,
    performGraphLoad: loadController.performGraphLoad,
    canMutateEnterpriseShell,
    buyerPolishedShell: buyerShell.buyerPolishedShell,
    demoUi: loadController.demoUi,
    effectiveGraph: loadController.effectiveGraph,
  });

  const handleRunIdChange = useCallback(
    (value: string) => {
      setRunId(value);

      if (value.trim().length > 0) {
        setGraphLoadRequested(true);
        return;
      }

      setGraphLoadRequested(false);
      loadController.setGraph(null);
    },
    [loadController],
  );

  return {
    ...buyerShell,
    runId,
    handleRunIdChange,
    architectureGraphNote: loadController.architectureGraphNote,
    effectiveGraph: loadController.effectiveGraph,
    demoUi: loadController.demoUi,
    graphSurfaceKey: loadController.graphSurfaceKey,
    typeFilter: loadController.typeFilter,
    handleTypeFilterChange: loadController.handleTypeFilterChange,
    nodeTypes: loadController.nodeTypes,
    mode: loadController.mode,
    setMode: loadController.setMode,
    loading: loadController.loading,
    graphInteractiveReady: loadController.graphInteractiveReady,
    handleGraphInteractiveSurfaceReady: loadController.handleGraphInteractiveSurfaceReady,
    defaultSelectedGraphNodeId,
    presentationView,
    setPresentationView,
    sampleGraphActive: loadController.sampleGraphActive,
    loadFailure: loadController.loadFailure,
    malformedMessage: loadController.malformedMessage,
    performGraphLoad: loadController.performGraphLoad,
    graphLoadRequested,
    setGraphLoadRequested,
    graphEndpointHint: loadController.graphEndpointHint,
    decisionId: loadController.decisionId,
    setDecisionId: loadController.setDecisionId,
    nodeId: loadController.nodeId,
    setNodeId: loadController.setNodeId,
    depth: loadController.depth,
    setDepth: loadController.setDepth,
    reviewListAvailability: loadController.reviewListAvailability,
    handleReviewsListAvailabilityChange: loadController.handleReviewsListAvailabilityChange,
    showSavedViews: savedViews.showSavedViews,
    getGraphSavedViewPayload: savedViews.getGraphSavedViewPayload,
    loadGraphSavedView: savedViews.loadGraphSavedView,
  };
}

export type GraphPageState = ReturnType<typeof useGraphPageState>;
