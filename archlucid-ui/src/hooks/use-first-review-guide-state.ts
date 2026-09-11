"use client";

import { useCallback, useMemo } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import { useEffectiveWorkingCareerRehearsalDoor } from "@/hooks/use-effective-working-career-rehearsal-door";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useRunSummaryQuery } from "@/hooks/use-run-summary-query";
import { readCachedLastOpenArchitectureId } from "@/lib/desk-continuity-preference";
import { resolveFirstReviewGuideCareerHonestyContext } from "@/lib/first-review-guide-career-honesty";
import { isLiveOperatorShellRecoveryContext } from "@/lib/live-operator-shell-recovery";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { SealedReviewRecordSummary } from "@/lib/core-pilot-commit-context";
import {
  resolveFirstReviewGuideHeaderActions,
  resolveFirstReviewGuideProgress,
  resolveFirstReviewGuideReadiness,
  resolveFirstReviewGuideRequiredBlockers,
  resolveFirstReviewGuideRunHref,
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
  readonly hasCommittedManifest: boolean;
  readonly sealedReviewRecord: SealedReviewRecordSummary | null;
  readonly evaluationScopeHelper: string | null;
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
  secondaryLabel: null,
  secondaryHref: null,
};

function resolveLoadingHeaderActions(): FirstReviewGuideHeaderActions {
  if (isLiveOperatorShellRecoveryContext()) {
    return loadingHeaderActions;
  }

  return {
    ...loadingHeaderActions,
    secondaryLabel: "Explore sample review",
    secondaryHref: `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
  };
}

export function useFirstReviewGuideState(): FirstReviewGuideViewState {
  const canExecute = useOperateCapability();
  const { isWorkingMode } = useWorkspaceMode();
  const { effectiveDoor } = useEffectiveWorkingCareerRehearsalDoor();
  const commitQuery = useCorePilotCommitContextQuery();
  const finishSetup = useFinishSetupReadinessContext();
  const latestRunId = (commitQuery.data?.latestRunId ?? "").trim();
  const runSummaryQuery = useRunSummaryQuery(latestRunId, {
    enabled: isWorkingMode && latestRunId.length > 0 && commitQuery.isSuccess,
  });
  const healthQuery = useHealthReadySummaryQuery({ enabled: isWorkingMode });

  const retry = useCallback(() => {
    void commitQuery.refetch();
  }, [commitQuery]);

  const careerHonesty = useMemo(
    () =>
      resolveFirstReviewGuideCareerHonestyContext({
        workingMode: isWorkingMode,
        runSummary: runSummaryQuery.data,
        healthSummary: healthQuery.data,
        effectiveWorkingCareerRehearsalDoor: effectiveDoor,
      }),
    [effectiveDoor, healthQuery.data, isWorkingMode, runSummaryQuery.data],
  );

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
        headerActions: resolveLoadingHeaderActions(),
        requiredBlockers: [],
        canExecute,
        readyToFinalize: false,
        latestRunHref: null,
        hasCommittedManifest: false,
        sealedReviewRecord: null,
        evaluationScopeHelper: careerHonesty.evaluationScopeHelper,
      };
    }

    const stateInput = {
      commitContext,
      canExecute,
      finishSetupContext: finishSetup.context,
      finishSetupLoaded: finishSetup.phase === "ready",
      workingMode: isWorkingMode,
      architectureId: readCachedLastOpenArchitectureId(),
      suppressReadyToFinalize: careerHonesty.suppressReadyToFinalize,
      hideSampleRecovery: careerHonesty.hideSampleRecovery,
    };

    const readyToFinalize =
      commitContext.latestRunReadyToFinalize
      && !commitContext.hasCommittedManifest
      && !careerHonesty.suppressReadyToFinalize;

    return {
      hasLoadedContext: true,
      isPending: false,
      isError: false,
      errorMessage: null,
      retry,
      readiness: resolveFirstReviewGuideReadiness(stateInput),
      progress: resolveFirstReviewGuideProgress(commitContext, careerHonesty.suppressReadyToFinalize),
      steps: resolveFirstReviewGuideSteps(stateInput),
      headerActions: resolveFirstReviewGuideHeaderActions(stateInput),
      requiredBlockers: resolveFirstReviewGuideRequiredBlockers(stateInput),
      canExecute,
      readyToFinalize,
      latestRunHref:
        commitContext.latestRunId !== null
          ? resolveFirstReviewGuideRunHref(commitContext.latestRunId, stateInput)
          : null,
      hasCommittedManifest: commitContext.hasCommittedManifest,
      sealedReviewRecord: commitContext.sealedReviewRecord,
      evaluationScopeHelper: careerHonesty.evaluationScopeHelper,
    };
  }, [
    canExecute,
    careerHonesty.evaluationScopeHelper,
    careerHonesty.hideSampleRecovery,
    careerHonesty.suppressReadyToFinalize,
    commitQuery.data,
    commitQuery.isError,
    commitQuery.isPending,
    finishSetup.context,
    finishSetup.phase,
    isWorkingMode,
    retry,
  ]);
}
