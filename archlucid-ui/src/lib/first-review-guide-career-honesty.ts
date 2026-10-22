import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";
import { resolveHonestyWorkingCareerRehearsalDoor } from "@/lib/governance/working-career-rehearsal-door-stamp";
import {
  WORKING_CAREER_DOOR_LABEL,
  WORKING_REHEARSAL_DOOR_LABEL,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import type { HealthReadyResponse } from "@/lib/health-dashboard-ready";
import { isLiveOperatorShellRecoveryContext } from "@/lib/live-operator-shell-recovery";
import { shouldSuppressReadyToFinalizeForCareerHonesty } from "@/lib/runs/run-pipeline-finalize-blocked-honesty";
import type { RunSummary } from "@/types/authority";

import { FIRST_REVIEW_GUIDE_EVALUATION_SCOPE_HELPER } from "@/lib/first-review-guide-evidence-copy";

/** CG-091 — Working first-review guide must not teach unlabeled Simulator Career proof. */
export const FIRST_REVIEW_GUIDE_WORKING_EVALUATION_SCOPE_HELPER =
  `On Working, ${WORKING_CAREER_DOOR_LABEL} review type + Real structural execute is record-complete proof. ${WORKING_REHEARSAL_DOOR_LABEL} review type or Simulator runs stay visible for dry-runs — do not screenshot them as procurement evidence.`;

export type FirstReviewGuideCareerHonestyContext = {
  readonly suppressReadyToFinalize: boolean;
  readonly hideSampleRecovery: boolean;
  readonly evaluationScopeHelper: string | null;
};

export function resolveFirstReviewGuideEvaluationScopeHelper(input: {
  readonly workingMode?: boolean;
}): string {
  if (input.workingMode !== true) {
    return FIRST_REVIEW_GUIDE_EVALUATION_SCOPE_HELPER;
  }

  return `${FIRST_REVIEW_GUIDE_EVALUATION_SCOPE_HELPER} ${FIRST_REVIEW_GUIDE_WORKING_EVALUATION_SCOPE_HELPER}`;
}

export function resolveFirstReviewGuideSuppressReadyToFinalize(input: {
  readonly workingMode?: boolean;
  readonly runSummary?: RunSummary | null;
  readonly healthSummary?: HealthReadyResponse | null;
  readonly effectiveWorkingCareerRehearsalDoor?: WorkingCareerRehearsalDoorId | null;
}): boolean {
  if (input.workingMode !== true || input.runSummary === undefined || input.runSummary === null) {
    return false;
  }

  const honestyDoor = resolveHonestyWorkingCareerRehearsalDoor({
    stampedDoor: input.runSummary.workingCareerRehearsalDoor ?? null,
    liveDoor: input.effectiveWorkingCareerRehearsalDoor ?? null,
  });

  return shouldSuppressReadyToFinalizeForCareerHonesty({
    workingDesk: true,
    preCommitGateEnabled: input.healthSummary?.preCommitGateEnabled,
    structuralExecutionMode: input.runSummary.structuralExecutionMode,
    isSample: input.runSummary.isSample,
    hostAgentExecutionMode: input.healthSummary?.agentExecutionMode,
    hostQualityGateMode: input.healthSummary?.agentOutputQualityGateMode,
    effectiveWorkingCareerRehearsalDoor: honestyDoor,
  });
}

export function resolveFirstReviewGuideCareerHonestyContext(input: {
  readonly workingMode?: boolean;
  readonly runSummary?: RunSummary | null;
  readonly healthSummary?: HealthReadyResponse | null;
  readonly effectiveWorkingCareerRehearsalDoor?: WorkingCareerRehearsalDoorId | null;
}): FirstReviewGuideCareerHonestyContext {
  const hideSampleRecovery = isLiveOperatorShellRecoveryContext();

  return {
    suppressReadyToFinalize: resolveFirstReviewGuideSuppressReadyToFinalize(input),
    hideSampleRecovery,
    evaluationScopeHelper:
      input.workingMode === true ? resolveFirstReviewGuideEvaluationScopeHelper({ workingMode: true }) : null,
  };
}
