import { buildCreateHomeReviewTabHref } from "@/lib/unified-review-workspace-tabs";

/** Create-home Evidence tab deep link to the Diagram reviewTab (TB-1848). */
export function buildRunDetailCreateHomeEvidenceDiagramHref(runId: string): string {
  return buildCreateHomeReviewTabHref(runId.trim(), "diagram");
}
