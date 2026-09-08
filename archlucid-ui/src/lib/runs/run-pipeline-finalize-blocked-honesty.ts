import { isTransparencyTrailComplete } from "@/lib/feasibility/transparency-trail-completeness";
import { shouldSuppressReadyToFinalizeForQualityGateHonesty } from "@/lib/governance/agent-output-quality-gate-career-honesty";
import { shouldSuppressReadyToFinalizeForSimulatorRehearsal } from "@/lib/governance/simulator-career-honesty";
import { countSkippedMustQuestions } from "@/lib/review-quality/count-skipped-must-questions";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import type { QualityGateModeInput } from "@/lib/governance/agent-output-quality-gate-career-honesty";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

export type RunPipelineFinalizeBlockedHonestyInput = {
  readonly workingDesk?: boolean;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly isSample?: boolean | null;
  readonly hostAgentExecutionMode?: string | null;
  readonly hostQualityGateMode?: QualityGateModeInput;
  readonly aggregateQualityGateOutcome?: number | null;
  readonly transparencyTrail?: TransparencyTrail | null;
};

/** FC-70 — suppress Ready-to-finalize when career honesty would block sealing. */
export function shouldSuppressReadyToFinalizeForCareerHonesty(
  input: RunPipelineFinalizeBlockedHonestyInput,
): boolean {
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
