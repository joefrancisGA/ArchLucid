import { cancelOperation } from "@/lib/api/operations-api";
import { patchInFlightOperation } from "@/lib/operations/in-flight-operations-store";
import { reviewPipelineOperationId } from "@/lib/operations/review-pipeline-in-flight";

export const REVIEW_PIPELINE_STOP_ANALYSIS_CTA = "Stop analysis";

export const REVIEW_PIPELINE_STOP_ANALYSIS_IN_FLIGHT_CTA = "Stopping analysis…";

export const REVIEW_PIPELINE_STOP_ANALYSIS_HELP =
  "Requests cooperative cancel on the server. Analysis may take a moment to wind down — it is not an instant abort.";

/** Same cancel path as the shell in-flight popover (TB-2076 / TB-2077). */
export async function requestReviewPipelineStopAnalysis(runId: string): Promise<void> {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return;
  }

  const operationId = reviewPipelineOperationId(trimmed);

  await cancelOperation(operationId);
  patchInFlightOperation(operationId, {
    state: "CancelRequested",
    stepLabel: "Cancel requested",
  });
}
