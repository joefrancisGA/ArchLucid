import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { resolveEnterpriseStatusKind } from "@/lib/enterprise-status-kind-resolver";
import { shouldSuppressReadyToFinalizeForQualityGateHonesty } from "@/lib/governance/agent-output-quality-gate-career-honesty";
import { PIPELINE_STATUS_LABELS, type RunPipelineInternalLabel } from "@/lib/pipeline-status-labels";
import { resolvePipelineStatusDisplayLabel } from "@/lib/resolve-pipeline-status-display-label";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import type { RunSummary } from "@/types/authority";

export type RunPipelineLabel = RunPipelineInternalLabel;

export type RunPipelineStatusPresentationInput = {
  readonly run: RunSummary;
  readonly workingDesk?: boolean;
  readonly hostAgentExecutionMode?: string | null;
  readonly hostQualityGateMode?: string | null;
  readonly aggregateQualityGateOutcome?: number | null;
};

/**
 * Maps authority snapshot flags to an operator-facing pipeline label (no dedicated status field on list DTO).
 */
export function deriveRunListPipelineLabel(
  run: RunSummary,
  qualityGateHonesty?: Omit<RunPipelineStatusPresentationInput, "run">,
): RunPipelineLabel {
  if (run.hasGoldenManifest === true) {
    return PIPELINE_STATUS_LABELS.finalized;
  }

  if (run.hasFindingsSnapshot === true) {
    if (
      shouldSuppressReadyToFinalizeForQualityGateHonesty({
        workingDesk: qualityGateHonesty?.workingDesk,
        structuralExecutionMode: run.structuralExecutionMode,
        isSample: run.isSample,
        hostAgentExecutionMode: qualityGateHonesty?.hostAgentExecutionMode,
        hostQualityGateMode: qualityGateHonesty?.hostQualityGateMode,
        aggregateQualityGateOutcome: qualityGateHonesty?.aggregateQualityGateOutcome,
      })
    ) {
      return PIPELINE_STATUS_LABELS.inPipeline;
    }

    return PIPELINE_STATUS_LABELS.readyToFinalize;
  }

  if (run.hasGraphSnapshot === true || run.hasContextSnapshot === true) {
    return PIPELINE_STATUS_LABELS.inPipeline;
  }

  return PIPELINE_STATUS_LABELS.starting;
}

export function runPipelineStatusTagKind(internal: RunPipelineInternalLabel): EnterpriseStatusKind {
  return resolveEnterpriseStatusKind(internal, "pipeline");
}

export function resolveRunPipelineStatusPresentation(
  input: RunPipelineStatusPresentationInput | RunSummary,
): {
  readonly internalLabel: RunPipelineInternalLabel;
  readonly displayLabel: string;
  readonly statusTagKind: EnterpriseStatusKind;
} {
  const run = "run" in input ? input.run : input;
  const qualityGateHonesty = "run" in input ? input : undefined;
  const internalLabel = deriveRunListPipelineLabel(run, qualityGateHonesty);

  return {
    internalLabel,
    displayLabel: resolvePipelineStatusDisplayLabel(internalLabel),
    statusTagKind: runPipelineStatusTagKind(internalLabel),
  };
}
