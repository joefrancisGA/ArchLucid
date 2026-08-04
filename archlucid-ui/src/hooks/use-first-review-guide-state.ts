"use client";

import { useMemo } from "react";

import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
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
  readonly isPending: boolean;
  readonly readiness: FirstReviewGuideReadiness;
  readonly progress: FirstReviewGuideProgress;
  readonly steps: readonly FirstReviewGuideStepPresentation[];
  readonly headerActions: FirstReviewGuideHeaderActions;
  readonly requiredBlockers: readonly FirstReviewGuideRequiredBlocker[];
  readonly canExecute: boolean;
  readonly readyToFinalize: boolean;
  readonly latestRunHref: string | null;
};

const emptyCommitContext: CorePilotCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
};

export function useFirstReviewGuideState(): FirstReviewGuideViewState {
  const canExecute = useOperateCapability();
  const commitQuery = useCorePilotCommitContextQuery();
  const finishSetup = useFinishSetupReadinessContext();

  return useMemo((): FirstReviewGuideViewState => {
    const commitContext =
      commitQuery.isPending || commitQuery.isError || commitQuery.data === undefined
        ? emptyCommitContext
        : commitQuery.data;

    const stateInput = {
      commitContext,
      canExecute,
      finishSetupContext: finishSetup.context,
      finishSetupLoaded: finishSetup.phase === "ready",
    };

    return {
      isPending: commitQuery.isPending || finishSetup.phase === "loading",
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
  }, [canExecute, commitQuery.data, commitQuery.isError, commitQuery.isPending, finishSetup.context, finishSetup.phase]);
}
