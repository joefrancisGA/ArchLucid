import type { BuildReviewWorkspaceTabHrefOptions } from "@/lib/unified-review-workspace-tabs";
import { buildCreateHomeReviewTabHref } from "@/lib/unified-review-workspace-tabs";

/** Findings-tab deep link when assessment is ready to review finalize posture (REG). */
export function buildArchitectureGovernanceFinalizeReadinessHref(
  runId: string,
  options?: Omit<BuildReviewWorkspaceTabHrefOptions, "includeCreateIntent">,
): string {
  return buildCreateHomeReviewTabHref(runId, "governance", options);
}

/** Activity-tab anchor where finalize controls live on create-home (REG primary CTA). */
export function buildArchitectureActivityFinalizeReadinessHref(
  runId: string,
  options?: Omit<BuildReviewWorkspaceTabHrefOptions, "includeCreateIntent">,
): string {
  return `${buildCreateHomeReviewTabHref(runId, "activity", options)}#architecture-assessment-progress`;
}
