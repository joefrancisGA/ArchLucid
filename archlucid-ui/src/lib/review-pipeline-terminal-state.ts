import { isQualityRejectedRunStatus } from "@/lib/execution-vs-quality-outcome-copy";
import type { ReviewPipelineDiagnosticContext } from "@/lib/review-pipeline-stall-diagnosis";

const TERMINAL_LEGACY_STATUSES = new Set(["Failed", "FailedPartial", "PartiallyCompleted"]);

/** Pipeline reached a terminal failure — client polling should stop and finalize stays blocked. */
export function isReviewPipelineTerminalFailure(
  context: ReviewPipelineDiagnosticContext | null | undefined,
): boolean {
  if (context?.isDeadLettered === true) {
    return true;
  }

  const legacyStatus = (context?.legacyRunStatus ?? "").trim();

  if (TERMINAL_LEGACY_STATUSES.has(legacyStatus)) {
    return true;
  }

  return isQualityRejectedRunStatus(legacyStatus);
}
