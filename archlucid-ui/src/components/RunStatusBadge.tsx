import { StatusPill } from "@/components/StatusPill";
import { ARCHITECTURE_REVIEW_VOCABULARY } from "@/lib/architecture-review-vocabulary";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
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
    return "Finalized";
  }

  if (run.hasFindingsSnapshot === true) {
    return "Ready to finalize";
  }

  if (run.hasGraphSnapshot === true || run.hasContextSnapshot === true) {
    return "In pipeline";
  }

  return "Starting";
}

function buyerPipelineStatusDisplayLabel(label: RunPipelineLabel): string {
  switch (label) {
    case "Finalized":
      return "Package finalized";

    case "Ready to finalize":
      return "Ready to seal";

    case "In pipeline":
      return "In flight";

    case "Starting":
      return "Starting";

    default:
      return label;
  }
}

function getTooltipContent(label: RunPipelineLabel): string {
  switch (label) {
    case "Finalized":
      return "The Golden Manifest has been committed and the architecture review is sealed.";
    case "Ready to finalize":
      return "All analysis is complete. An operator must review and commit the Golden Manifest.";
    case "In pipeline":
      return "The architecture graph and context have been extracted, and analysis is currently running.";
    case "Starting":
      return "The architecture request has been received and the execution pipeline is initializing.";
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
              ariaLabel={`${ARCHITECTURE_REVIEW_VOCABULARY.pipelineStatusAriaPrefix}: ${displayLabel}`}
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
