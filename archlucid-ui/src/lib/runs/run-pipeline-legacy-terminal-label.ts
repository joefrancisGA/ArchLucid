import { isQualityRejectedRunStatus } from "@/lib/execution-vs-quality-outcome-copy";
import { PIPELINE_STATUS_LABELS, type RunPipelineInternalLabel } from "@/lib/pipeline-status-labels";

const TERMINAL_EXECUTE_FAILURE_STATUSES = new Set(["Failed", "FailedPartial", "PartiallyCompleted"]);

function normalizeLegacyStatus(status: string | null | undefined): string {
  return (status ?? "").trim();
}

/**
 * When coordinator legacy status is terminal, snapshot flags must not imply the review is still running.
 */
export function resolveTerminalPipelineLabelFromLegacyStatus(
  legacyRunStatus: string | null | undefined,
): RunPipelineInternalLabel | null {
  const status = normalizeLegacyStatus(legacyRunStatus);

  if (status.length === 0) {
    return null;
  }

  if (status === "Failed") {
    return PIPELINE_STATUS_LABELS.failed;
  }

  if (TERMINAL_EXECUTE_FAILURE_STATUSES.has(status) || isQualityRejectedRunStatus(status)) {
    return PIPELINE_STATUS_LABELS.partiallyFailed;
  }

  return null;
}

export function isTerminalExecuteLegacyRunStatus(legacyRunStatus: string | null | undefined): boolean {
  return resolveTerminalPipelineLabelFromLegacyStatus(legacyRunStatus) !== null;
}
