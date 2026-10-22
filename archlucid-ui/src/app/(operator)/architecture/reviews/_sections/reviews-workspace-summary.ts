import { resolveRunFindingCountDisplay, resolveRunWarningCountDisplay } from "@/lib/operator/operator-home-run-list-insight";
import { filterTenantOverviewRuns } from "@/lib/operator/operator-home-recent-reviews-outcome";
import type { RunSummary } from "@/types/authority";

export type ReviewsWorkspaceSummary = {
  readonly inProgress: number;
  readonly committed: number;
  readonly findings: number;
  readonly openRisks: number;
  readonly readyForGovernance: number;
};

function finiteCount(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

/** Compact workspace counters for the `/architecture/reviews` hub summary row. */
export function deriveReviewsWorkspaceSummary(runs: readonly RunSummary[]): ReviewsWorkspaceSummary {
  const tenantRuns = filterTenantOverviewRuns(runs);
  let inProgress = 0;
  let committed = 0;
  let findings = 0;
  let openRisks = 0;
  let readyForGovernance = 0;

  for (const run of tenantRuns) {
    if (run.hasGoldenManifest === true) {
      committed += 1;
      readyForGovernance += 1;
    } else {
      inProgress += 1;
    }

    const findingCount = resolveRunFindingCountDisplay(run);

    if (findingCount !== null) {
      findings += findingCount;
    }

    const warningCount = resolveRunWarningCountDisplay(run);

    if (warningCount !== null) {
      openRisks += warningCount;
    } else if (run.hasWarnings === true || run.hasGovernanceWarnings === true) {
      openRisks += 1;
    }
  }

  return {
    inProgress,
    committed,
    findings,
    openRisks,
    readyForGovernance,
  };
}

export { finiteCount as reviewsWorkspaceFiniteCount };
