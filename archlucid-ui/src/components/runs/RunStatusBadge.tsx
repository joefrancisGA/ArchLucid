import type { ReactElement } from "react";

import { cn } from "@/lib/utils";
import { StatusTag } from "@/components/ui/status-tag";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { resolvePipelineStatusAriaPrefix } from "@/lib/resolve-pipeline-status-display-label";
import { resolveRunPipelineStatusPresentation } from "@/lib/runs/run-pipeline-status-presentation";
import type { RunSummary } from "@/types/authority";

export type { RunPipelineLabel } from "@/lib/runs/run-pipeline-status-presentation";
export { deriveRunListPipelineLabel } from "@/lib/runs/run-pipeline-status-presentation";

export type RunStatusBadgeProps = {
  run: RunSummary;
  className?: string;
};

/**
 * Visual scan helper for run list rows — derived from snapshot flags on {@link RunSummary}.
 * Reviews hub inventory uses canonical StatusTag vocabulary (**TB-1649**).
 */
export function RunStatusBadge({ run, className }: RunStatusBadgeProps): ReactElement {
  const buyerPolished = isBuyerPolishedOperatorShellEnv();
  const presentation = resolveRunPipelineStatusPresentation(run);
  const ariaPrefix = resolvePipelineStatusAriaPrefix();

  const pipelineTag = (
    <StatusTag
      kind={presentation.statusTagKind}
      label={presentation.displayLabel}
      className={cn("shrink-0", className)}
      aria-label={`${ariaPrefix}: ${presentation.displayLabel}`}
    />
  );

  if (buyerPolished && run.hasGovernanceWarnings === true && run.hasGoldenManifest === true) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        {pipelineTag}
        <StatusTag kind="approved-with-monitoring" label="Monitoring active" />
      </span>
    );
  }

  return pipelineTag;
}
