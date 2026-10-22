/**
 * Review pipeline dev telemetry on the progress tracker. Off by default after GA.
 * Set `NEXT_PUBLIC_REVIEW_PIPELINE_DEBUG=1` to show the collapsible diagnostics panel.
 */
export function isReviewPipelineDebugEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_REVIEW_PIPELINE_DEBUG;

  if (raw === "1" || raw === "true") {
    return true;
  }

  return false;
}
