import type { ReactElement } from "react";

import { useProductionDeskChrome } from "@/hooks/useProductionDeskChrome";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import { cn } from "@/lib/utils";
import { StatusTag } from "@/components/ui/status-tag";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { resolvePipelineStatusAriaPrefix } from "@/lib/resolve-pipeline-status-display-label";
import {
  resolveRunPipelineStatusPresentation,
  type RunPipelineStatusPresentationInput,
} from "@/lib/runs/run-pipeline-status-presentation";
import type { RunSummary } from "@/types/authority";

export type { RunPipelineLabel } from "@/lib/runs/run-pipeline-status-presentation";
export { deriveRunListPipelineLabel } from "@/lib/runs/run-pipeline-status-presentation";

export type RunStatusBadgeProps = {
  run: RunSummary;
  className?: string;
  finalizeHonesty?: Omit<RunPipelineStatusPresentationInput, "run">;
};

/**
 * Visual scan helper for run list rows — derived from snapshot flags on {@link RunSummary}.
 * Reviews hub inventory uses canonical StatusTag vocabulary (**TB-1649**).
 */
export function RunStatusBadge({ run, className, finalizeHonesty }: RunStatusBadgeProps): ReactElement {
  const buyerPolished = isBuyerPolishedOperatorShellEnv();
  const workingDesk = useProductionDeskChrome();
  const healthQuery = useHealthReadySummaryQuery({ enabled: workingDesk });
  const presentation = resolveRunPipelineStatusPresentation({
    run,
    workingDesk,
    preCommitGateEnabled: healthQuery.data?.preCommitGateEnabled ?? finalizeHonesty?.preCommitGateEnabled,
    ...finalizeHonesty,
  });
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
