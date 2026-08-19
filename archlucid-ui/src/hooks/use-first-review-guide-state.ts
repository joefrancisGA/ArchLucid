"use client";

import { useCallback, useMemo } from "react";

import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import {
  resolveFirstReviewGuideHeaderActions,
  resolveFirstReviewGuideProgress,
  resolveFirstReviewGuideReadiness,
  resolveFirstReviewGuideRequiredBlockers,
  resolveFirstReviewGuideSteps,
  type FirstReviewGuideHeaderActions,
  type FirstReviewGuideProgress,
  type FirstReviewGuideReadiness,
  type FirstReviewGuideRequiredBlocker,
  type FirstReviewGuideStepPresentation,
} from "@/lib/first-review-guide-state";

export type FirstReviewGuideViewState = {
  readonly hasLoadedContext: boolean;
  readonly isPending: boolean;
  readonly isError: boolean;
  readonly errorMessage: string | null;
  readonly retry: () => void;
  readonly readiness: FirstReviewGuideReadiness;
  readonly progress: FirstReviewGuideProgress;
  readonly steps: readonly FirstReviewGuideStepPresentation[];
  readonly headerActions: FirstReviewGuideHeaderActions;
  readonly requiredBlockers: readonly FirstReviewGuideRequiredBlocker[];
  readonly canExecute: boolean;
  readonly readyToFinalize: boolean;
  readonly latestRunHref: string | null;
};

const loadingReadiness: FirstReviewGuideReadiness = {
  kind: "ready-to-start",
  headline: "Loading review progress",
  detail: null,
};

const loadingProgress: FirstReviewGuideProgress = {
  phase: "not-started",
  progressFraction: 0,
  summaryLabel: "Loading",
  detailLabel: null,
  completedStepCount: 0,
  totalStepCount: 7,
};

const loadingHeaderActions: FirstReviewGuideHeaderActions = {
  primaryLabel: "Start first review",
  primaryHref: "/architecture/reviews/new",
  primaryDisabled: true,
  primaryDisabledReason: null,
  secondaryLabel: "Explore sample review",
  secondaryHref: `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
};

export function useFirstReviewGuideState(): FirstReviewGuideViewState {
  const canExecute = useOperateCapability();
  const commitQuery = useCorePilotCommitContextQuery();
  const finishSetup = useFinishSetupReadinessContext();

  const retry = useCallback(() => {
    void commitQuery.refetch();
  }, [commitQuery]);

  return useMemo((): FirstReviewGuideViewState => {
    const isPending = commitQuery.isPending || finishSetup.phase === "loading";
    const isError = commitQuery.isError;
    const commitContext = commitQuery.data;
    const hasLoadedContext = !isPending && !isError && commitContext !== undefined;

    if (!hasLoadedContext) {
      return {
        hasLoadedContext: false,
        isPending,
        isError,
        errorMessage: isError ? "Could not load review progress from your workspace." : null,
        retry,
        readiness: loadingReadiness,
        progress: loadingProgress,
        steps: [],
        headerActions: loadingHeaderActions,
        requiredBlockers: [],
        canExecute,
        readyToFinalize: false,
        latestRunHref: null,
      };
    }

    const stateInput = {
      commitContext,
      canExecute,
      finishSetupContext: finishSetup.context,
      finishSetupLoaded: finishSetup.phase === "ready",
    };

    return {
      hasLoadedContext: true,
      isPending: false,
      isError: false,
      errorMessage: null,
      retry,
      readiness: resolveFirstReviewGuideReadiness(stateInput),
      progress: resolveFirstReviewGuideProgress(commitContext),
      steps: resolveFirstReviewGuideSteps(stateInput),
      headerActions: resolveFirstReviewGuideHeaderActions(stateInput),
      requiredBlockers: resolveFirstReviewGuideRequiredBlockers(stateInput),
      canExecute,
      readyToFinalize: commitContext.latestRunReadyToFinalize && !commitContext.hasCommittedManifest,
      latestRunHref:
        commitContext.latestRunId !== null
          ? `/architecture/reviews/${encodeURIComponent(commitContext.latestRunId)}`
          : null,
    };
  }, [
    canExecute,
    commitQuery.data,
    commitQuery.isError,
    commitQuery.isPending,
    finishSetup.context,
    finishSetup.phase,
    retry,
  ]);
}
