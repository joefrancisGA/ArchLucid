import { isWorkspaceAiConfigurationFailure } from "@/lib/review-failure-recovery-role-copy";
import type { RunDetailLastFailureSummary } from "@/components/resolve-run-detail-last-failure-summary";
import type { RunSummary } from "@/types/authority";

function completedPipelineStages(summary: RunSummary | null | undefined): number {
  if (summary === null || summary === undefined) {
    return 0;
  }

  return [
    summary.hasContextSnapshot === true,
    summary.hasGraphSnapshot === true,
    summary.hasFindingsSnapshot === true,
    summary.hasGoldenManifest === true,
  ].filter(Boolean).length;
}

/** True when a terminal review failure should auto-run the workspace AI availability probe on page load. */
export function deriveReviewFailureRequiresWorkspaceAiProbe(input: {
  readonly legacyRunStatus?: string | null;
  readonly lastFailureSummary?: RunDetailLastFailureSummary | null;
  readonly pipelineSummary?: RunSummary | null;
  readonly realModeFellBackToSimulator?: boolean | null;
  readonly usesCustomerAiConnection?: boolean;
}): boolean {
  return isWorkspaceAiConfigurationFailure({
    triageScenarioId: input.lastFailureSummary?.triageScenarioId,
    failureClass: input.lastFailureSummary?.failureClass,
    legacyRunStatus: input.legacyRunStatus,
    completedStages: completedPipelineStages(input.pipelineSummary ?? null),
    realModeFellBackToSimulator: input.realModeFellBackToSimulator === true,
    usesCustomerAiConnection: input.usesCustomerAiConnection === true,
  });
}
