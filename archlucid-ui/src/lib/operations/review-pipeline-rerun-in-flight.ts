import type { TrackedInFlightOperation } from "@/lib/operations/in-flight-operations-store";
import { isTerminalOperationState } from "@/lib/operations/operation-state";

/** Do this next sentence while a re-run attempt is active — stale failure copy must not show. */
export const REVIEW_PIPELINE_RE_RUN_IN_PROGRESS_DO_THIS_NEXT_SENTENCE =
  "Re-run in progress — follow assessment progress below.";

/**
 * True when the shell in-flight store shows a non-terminal pipeline operation for this review.
 * Re-runs reuse `run:{runId}`; legacy failure fields stay populated until the worker advances.
 */
export function isReviewPipelineReRunInFlight(
  operation: TrackedInFlightOperation | null | undefined,
): boolean {
  if (operation === null || operation === undefined) {
    return false;
  }

  return !isTerminalOperationState(operation.state);
}
