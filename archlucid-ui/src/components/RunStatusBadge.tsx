import { StatusPill } from "@/components/StatusPill";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
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

  return (
    <StatusPill
      status={displayLabel}
      domain="pipeline"
      className={cn("shrink-0", className)}
      ariaLabel={`Run pipeline status: ${displayLabel}`}
    />
  );
}
