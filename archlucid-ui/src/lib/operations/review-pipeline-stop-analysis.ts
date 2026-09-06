import { cancelOperation } from "@/lib/api/operations-api";
import { patchInFlightOperation } from "@/lib/operations/in-flight-operations-store";
import { reviewPipelineOperationId } from "@/lib/operations/review-pipeline-in-flight";

export const REVIEW_PIPELINE_STOP_ANALYSIS_CTA = "Stop analysis";

export const REVIEW_PIPELINE_STOP_ANALYSIS_IN_FLIGHT_CTA = "Stopping analysis…";

export const REVIEW_PIPELINE_STOP_ANALYSIS_REQUESTED_HEADLINE = "Stop analysis requested";

export const REVIEW_PIPELINE_STOP_ANALYSIS_REQUESTED_DETAIL =
  "The server is winding down this analysis cooperatively. This page updates when the attempt reaches a terminal state.";

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
