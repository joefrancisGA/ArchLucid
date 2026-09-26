/** Whether review-package What-if / run actions should treat analysis as still running. */
export function resolveReviewPackagePipelineInFlight(showProgressTracker: boolean): boolean {
  return showProgressTracker;
}
