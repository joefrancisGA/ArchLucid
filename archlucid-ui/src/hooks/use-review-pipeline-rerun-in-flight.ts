"use client";

import { useReviewPipelineInFlightForRun } from "@/hooks/use-review-pipeline-in-flight-for-run";
import { isReviewPipelineReRunInFlight } from "@/lib/operations/review-pipeline-rerun-in-flight";

/** True when a review re-run attempt is active for `runId` (non-terminal shell operation row). */
export function useReviewPipelineReRunInFlight(runId: string): boolean {
  const inFlightOperation = useReviewPipelineInFlightForRun(runId);

  return isReviewPipelineReRunInFlight(inFlightOperation);
}
