"use client";

import { useEffect, useMemo } from "react";

import {
  resolveEvidenceTrailPresentationView,
  resolveGraphIdleEmptyPreset,
  type EvidenceTrailPresentationView,
  type GraphMode,
} from "@/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers";
import { OPERATOR_GRAPH_PAGE_SUBTITLE } from "@/lib/buyer/buyer-polish-copy";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { OPERATOR_PAGE_CONTAINER } from "@/lib/design-tokens";
import {
  EVIDENCE_GRAPH_PAGE_SUBTITLE,
  EVIDENCE_GRAPH_PAGE_TITLE,
} from "@/lib/evidence-graph-page";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  resolveGraphReviewPickerState,
  shouldShowBuyerEvidenceGraphLoadButton,
  shouldShowGraphIdleCard,
  type AskRunListAvailability,
} from "@/lib/graph-page-state";
import {
  resolveGraphInspectEmphasizedStepId,
  resolveGraphInspectSteps,
} from "@/lib/graph-inspect-checklist";
import type { GraphViewModel } from "@/types/graph";
import type { EmptyStateProps } from "@/components/EmptyState";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";

export type UseGraphPageBuyerShellInput = {
  readonly runId: string;
  readonly graphLoadRequested: boolean;
  readonly effectiveGraph: GraphViewModel | null;
  readonly loading: boolean;
  readonly loadFailure: ApiLoadFailureState | null;
  readonly malformedMessage: string | null;
  readonly reviewsListLoadError: boolean;
  readonly reviewListAvailability: AskRunListAvailability;
  readonly demoUi: boolean;
  readonly mode: GraphMode;
  readonly setMode: (value: GraphMode) => void;
  readonly graphInteractiveReady: boolean;
  readonly presentationView: EvidenceTrailPresentationView;
};

export function useGraphPageBuyerShell(input: UseGraphPageBuyerShellInput) {
  const {
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
  } = input;

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const graphMainColumnMaxClass = buyerPolishedShell
    ? OPERATOR_PAGE_CONTAINER.variant.dashboard
    : OPERATOR_PAGE_CONTAINER.variant.workflow;

  const reviewPickerState = resolveGraphReviewPickerState(reviewListAvailability, runId);

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
  }, [buyerPolishedShell, demoUi, setMode]);

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

  const graphInspectSteps = useMemo(
    () =>
      resolveGraphInspectSteps({
        reviewPicked: runId.trim().length > 0,
        graphLoaded: effectiveGraph !== null,
        inspectComplete: graphInteractiveReady,
      }),
    [effectiveGraph, graphInteractiveReady, runId],
  );
  const graphInspectEmphasizedStepId = useMemo(
    () =>
      resolveGraphInspectEmphasizedStepId({
        reviewPicked: runId.trim().length > 0,
        graphLoaded: effectiveGraph !== null,
        inspectComplete: graphInteractiveReady,
      }),
    [effectiveGraph, graphInteractiveReady, runId],
  );

  const showLoadFailureAlert =
    !reviewsListLoadError &&
    loadFailure !== null &&
    effectiveGraph === null &&
    (!buyerPolishedShell || graphLoadRequested);

  return {
    buyerPolishedShell,
    pageTitle,
    pageSubtitle,
    graphMainColumnMaxClass,
    reviewPickerState,
    buyerTraceWithoutGraph,
    showOperatorControls,
    showIdleCard,
    graphIdlePreset,
    loadButtonLabel,
    showLoadButton,
    buyerEmptyWorkspaceFocus,
    showReviewPickerBeforeCanvas,
    graphInspectSteps,
    graphInspectEmphasizedStepId,
    showLoadFailureAlert,
  };
}
