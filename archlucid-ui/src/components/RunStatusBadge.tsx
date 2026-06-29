import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/StatusPill";
import { cn } from "@/lib/utils";
import { StatusTag } from "@/components/ui/status-tag";
import { cn } from "@/lib/utils";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { cn } from "@/lib/utils";
import {
  ARCHITECTURE_REVIEW_LABELS,
  PIPELINE_STATUS_LABELS,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { RunSummary } from "@/types/authority";

export type RunPipelineLabel =
  | "Finalized"
  | "Ready to finalize"
  | "In pipeline"
  | "Starting";

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

function buyerPipelineStatusDisplayLabel(label: RunPipelineLabel): string {
  switch (label) {
    case PIPELINE_STATUS_LABELS.finalized:
      return PIPELINE_STATUS_LABELS.packageFinalized;

    case PIPELINE_STATUS_LABELS.readyToFinalize:
      return PIPELINE_STATUS_LABELS.readyToSeal;

    case PIPELINE_STATUS_LABELS.inPipeline:
      return PIPELINE_STATUS_LABELS.inFlight;

    case PIPELINE_STATUS_LABELS.starting:
      return PIPELINE_STATUS_LABELS.starting;

    default:
      return label;
  }
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
  const displayLabel = buyerPolished ? buyerPipelineStatusDisplayLabel(internal) : internal;

  const pill = (
    <StatusPill
      status={displayLabel}
      domain="pipeline"
      className={cn("shrink-0", className)}
      ariaLabel={`${ARCHITECTURE_REVIEW_LABELS.pipelineStatusAriaPrefix}: ${displayLabel}`}
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
