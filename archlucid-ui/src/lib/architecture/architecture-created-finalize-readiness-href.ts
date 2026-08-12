import {
  buildArchitectureWorkspaceTabHref,
  type BuildArchitectureWorkspaceTabHrefOptions,
} from "@/lib/architecture/architecture-workspace-tabs";

/** Findings-tab deep link when assessment is ready to review finalize posture (REG). */
export function buildArchitectureGovernanceFinalizeReadinessHref(
  runId: string,
  options?: BuildArchitectureWorkspaceTabHrefOptions,
): string {
  return buildArchitectureWorkspaceTabHref(runId, "governance", options);
}

/** Activity-tab anchor where finalize controls live on create-home (REG primary CTA). */
export function buildArchitectureActivityFinalizeReadinessHref(
  runId: string,
  options?: BuildArchitectureWorkspaceTabHrefOptions,
): string {
  return `${buildArchitectureWorkspaceTabHref(runId, "activity", options)}#architecture-assessment-progress`;
}
