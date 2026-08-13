import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { PIPELINE_STATUS_LABELS, type RunPipelineInternalLabel } from "@/lib/pipeline-status-labels";
import { resolvePipelineStatusDisplayLabel } from "@/lib/resolve-pipeline-status-display-label";
import type { RunSummary } from "@/types/authority";

export type RunPipelineLabel = RunPipelineInternalLabel;

/**
 * Maps authority snapshot flags to an operator-facing pipeline label (no dedicated status field on list DTO).
 */
export function deriveRunListPipelineLabel(run: RunSummary): RunPipelineLabel {
  if (run.hasGoldenManifest === true) {
    return PIPELINE_STATUS_LABELS.finalized;
  }

  if (run.hasFindingsSnapshot === true) {
    return PIPELINE_STATUS_LABELS.readyToFinalize;
  }

  if (run.hasGraphSnapshot === true || run.hasContextSnapshot === true) {
    return PIPELINE_STATUS_LABELS.inPipeline;
  }

  return PIPELINE_STATUS_LABELS.starting;
}

export function runPipelineStatusTagKind(internal: RunPipelineInternalLabel): EnterpriseStatusKind {
  switch (internal) {
    case PIPELINE_STATUS_LABELS.finalized:
      return "approved";
    case PIPELINE_STATUS_LABELS.readyToFinalize:
      return "needs-attention";
    case PIPELINE_STATUS_LABELS.inPipeline:
      return "in-progress";
    case PIPELINE_STATUS_LABELS.starting:
      return "neutral";
    default: {
      const exhaustiveCheck: never = internal;

      return exhaustiveCheck;
    }
  }
}

export function resolveRunPipelineStatusPresentation(run: RunSummary): {
  readonly internalLabel: RunPipelineInternalLabel;
  readonly displayLabel: string;
  readonly statusTagKind: EnterpriseStatusKind;
} {
  const internalLabel = deriveRunListPipelineLabel(run);

  return {
    internalLabel,
    displayLabel: resolvePipelineStatusDisplayLabel(internalLabel),
    statusTagKind: runPipelineStatusTagKind(internalLabel),
  };
}
