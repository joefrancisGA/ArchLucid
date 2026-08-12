import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/StatusPill";
import { StatusTag } from "@/components/ui/status-tag";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { PIPELINE_STATUS_LABELS } from "@/lib/pipeline-status-labels";
import {
  resolvePipelineStatusAriaPrefix,
  resolvePipelineStatusDisplayLabel,
  type RunPipelineInternalLabel,
} from "@/lib/resolve-pipeline-status-display-label";
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

export type RunStatusBadgeProps = {
  run: RunSummary;
  className?: string;
};

/**
 * Visual scan helper for run list rows — derived from snapshot flags on {@link RunSummary}.
 * In buyer-polished mode shows a layered two-tier badge: pipeline state + governance state when applicable.
 */
export function RunStatusBadge({ run, className }: RunStatusBadgeProps) {
  const buyerPolished = isBuyerPolishedOperatorShellEnv();
  const internal = deriveRunListPipelineLabel(run);
  const displayLabel = resolvePipelineStatusDisplayLabel(internal);
  const ariaPrefix = resolvePipelineStatusAriaPrefix();

  const pill = (
    <StatusPill
      status={displayLabel}
      domain="pipeline"
      className={cn("shrink-0", className)}
      ariaLabel={`${ariaPrefix}: ${displayLabel}`}
    />
  );

  if (buyerPolished && run.hasGovernanceWarnings === true && run.hasGoldenManifest === true) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        {pill}
        <StatusTag kind="approved-with-monitoring" label="Monitoring active" />
      </span>
    );
  }

  return pill;
}
