import { isTransparencyTrailComplete } from "@/lib/feasibility/transparency-trail-completeness";
import { shouldSuppressReadyToFinalizeForPreCommitGateHonesty } from "@/lib/governance/pre-commit-gate-career-honesty";
import { shouldSuppressReadyToFinalizeForQualityGateHonesty } from "@/lib/governance/agent-output-quality-gate-career-honesty";
import {
  isRehearsalStructuralExecutionMode,
  shouldSuppressReadyToFinalizeForSimulatorRehearsal,
  SIMULATOR_REHEARSAL_CAREER_BLOCK_REASON,
} from "@/lib/governance/simulator-career-honesty";
import { shouldSuppressReadyToFinalizeForWorkingRehearsalDoor } from "@/lib/governance/working-career-rehearsal-door";
import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";
import { countSkippedMustQuestions } from "@/lib/review-quality/count-skipped-must-questions";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import type { QualityGateModeInput } from "@/lib/governance/agent-output-quality-gate-career-honesty";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

export type RunPipelineFinalizeBlockedHonestyInput = {
  readonly workingDesk?: boolean;
  readonly preCommitGateEnabled?: boolean | null;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly isSample?: boolean | null;
  readonly hostAgentExecutionMode?: string | null;
  readonly hostQualityGateMode?: QualityGateModeInput;
  readonly aggregateQualityGateOutcome?: number | null;
  readonly transparencyTrail?: TransparencyTrail | null;
  readonly effectiveWorkingCareerRehearsalDoor?: WorkingCareerRehearsalDoorId | null;
};

function shouldSuppressRehearsalDoorReadyLabel(input: RunPipelineFinalizeBlockedHonestyInput): boolean {
  return shouldSuppressReadyToFinalizeForWorkingRehearsalDoor(input);
}

function allowsLp06RehearsalSimulatorFinalize(input: RunPipelineFinalizeBlockedHonestyInput): boolean {
  if (!shouldSuppressRehearsalDoorReadyLabel(input)) {
    return false;
  }

  return isRehearsalStructuralExecutionMode(input.structuralExecutionMode ?? null);
}

function shouldBlockSharedCareerFinalizeChecks(input: RunPipelineFinalizeBlockedHonestyInput): boolean {
  if (shouldSuppressReadyToFinalizeForPreCommitGateHonesty(input)) {
    return true;
  }

  if (shouldSuppressReadyToFinalizeForQualityGateHonesty(input)) {
    return true;
  }

  if (shouldSuppressReadyToFinalizeForSimulatorRehearsal(input)) {
    return true;
  }

  if (input.transparencyTrail === undefined) {
    return false;
  }

  const trail = input.transparencyTrail;

  if (!isTransparencyTrailComplete(trail)) {
    return true;
  }

  if (countSkippedMustQuestions(trail) > 0) {
    return true;
  }

  return false;
}

/** FC-70 — suppress Ready-to-finalize label when career honesty would mislabel the run. */
export function shouldSuppressReadyToFinalizeForCareerHonesty(
  input: RunPipelineFinalizeBlockedHonestyInput,
): boolean {
  if (shouldSuppressRehearsalDoorReadyLabel(input)) {
    return true;
  }

  return shouldBlockSharedCareerFinalizeChecks(input);
}

/** CG-021 — block finalize mutation (server parity + disabled CTA). LP-06 allows Rehearsal + Simulator. */
export function shouldBlockFinalizeForCareerHonesty(
  input: RunPipelineFinalizeBlockedHonestyInput,
): boolean {
  if (allowsLp06RehearsalSimulatorFinalize(input)) {
    return shouldBlockSharedCareerFinalizeChecks(input);
  }

  if (shouldSuppressRehearsalDoorReadyLabel(input)) {
    return true;
  }

  return shouldBlockSharedCareerFinalizeChecks(input);
}

/** CG-021 — client commit-blocked copy when Career door cannot finalize on Simulator/Fallback. */
export function resolveCareerFinalizeBlockedReason(
  input: RunPipelineFinalizeBlockedHonestyInput,
): string | null {
  if (!shouldSuppressReadyToFinalizeForSimulatorRehearsal(input)) {
    return null;
  }

  return SIMULATOR_REHEARSAL_CAREER_BLOCK_REASON;
}
