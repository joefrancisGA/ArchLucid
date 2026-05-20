import { StatusPill } from "@/components/StatusPill";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  ARCHITECTURE_REVIEW_LABELS,
  PIPELINE_STATUS_LABELS,
  PIPELINE_STATUS_TOOLTIPS,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { RunSummary } from "@/types/authority";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

function getTooltipContent(label: RunPipelineLabel): string {
  switch (label) {
    case PIPELINE_STATUS_LABELS.finalized:
      return PIPELINE_STATUS_TOOLTIPS.finalized;
    case PIPELINE_STATUS_LABELS.readyToFinalize:
      return PIPELINE_STATUS_TOOLTIPS.readyToFinalize;
    case PIPELINE_STATUS_LABELS.inPipeline:
      return PIPELINE_STATUS_TOOLTIPS.inPipeline;
    case PIPELINE_STATUS_LABELS.starting:
      return PIPELINE_STATUS_TOOLTIPS.starting;
    default:
      return "";
  }
}

export type RunStatusBadgeProps = {
  run: RunSummary;
  className?: string;
};

/**
 * Visual scan helper for run list rows — derived from snapshot flags on {@link RunSummary}.
 */
export function RunStatusBadge({ run, className }: RunStatusBadgeProps) {
  const internal = deriveRunListPipelineLabel(run);
  const displayLabel = isBuyerPolishedOperatorShellEnv() ? buyerPipelineStatusDisplayLabel(internal) : internal;
  const tooltipContent = getTooltipContent(internal);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-block cursor-help">
            <StatusPill
              status={displayLabel}
              domain="pipeline"
              className={cn("shrink-0", className)}
              ariaLabel={`${ARCHITECTURE_REVIEW_LABELS.pipelineStatusAriaPrefix}: ${displayLabel}`}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-sm">
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
