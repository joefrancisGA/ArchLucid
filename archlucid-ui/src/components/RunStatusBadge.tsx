import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RunSummary } from "@/types/authority";

export type RunPipelineLabel =
  | "Committed"
  | "Ready for commit"
  | "In pipeline"
  | "Starting";

/**
 * Maps authority snapshot flags to an operator-facing pipeline label (no dedicated status field on list DTO).
 */
export function deriveRunListPipelineLabel(run: RunSummary): RunPipelineLabel {
  if (run.hasGoldenManifest === true) {
    return "Committed";
  }

  if (run.hasFindingsSnapshot === true) {
    return "Ready for commit";
  }

  if (run.hasGraphSnapshot === true || run.hasContextSnapshot === true) {
    return "In pipeline";
  }

  return "Starting";
}

function variantForLabel(label: RunPipelineLabel): "default" | "secondary" | "destructive" | "outline" {
  switch (label) {
    case "Committed":
      return "default";
    case "Ready for commit":
      return "secondary";
    case "In pipeline":
      return "outline";
    case "Starting":
    default:
      return "outline";
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
  const label = deriveRunListPipelineLabel(run);
  const variant = variantForLabel(label);

  return (
    <Badge
      variant={variant}
      className={cn("shrink-0", label === "Ready for commit" && "border-amber-500/60 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100", className)}
      aria-label={`Run pipeline status: ${label}`}
    >
      {label}
    </Badge>
  );
}
