import { analysisStagesCompleteOnSummary } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/pipeline-complete-on-summary";
import type { RunDetailCriticalPageBundle } from "@/lib/fetch-run-detail-page-bundle-client";
import type { ManifestFeasibilityVerdict, TransparencyTrail } from "@/types/feasibility-verdict";

export type InhabitedFindingsTrailBundleSnapshot = {
  readonly runId: string;
  readonly trail: TransparencyTrail | null;
  readonly feasibilityVerdict: ManifestFeasibilityVerdict | null;
  readonly enginesSucceeded: number | null;
  readonly runCompleted: boolean;
};

export function resolveInhabitedFindingsTrailBundleSnapshot(
  runId: string,
  bundle: RunDetailCriticalPageBundle,
): InhabitedFindingsTrailBundleSnapshot {
  const feasibilityVerdict = bundle.manifestSummary?.feasibilityVerdict ?? null;
  const progressSummary = bundle.progressSummary;

  return {
    runId: runId.trim(),
    trail: feasibilityVerdict?.transparencyTrail ?? null,
    feasibilityVerdict,
    enginesSucceeded: progressSummary?.enginesSucceeded ?? null,
    runCompleted: analysisStagesCompleteOnSummary(progressSummary),
  };
}
