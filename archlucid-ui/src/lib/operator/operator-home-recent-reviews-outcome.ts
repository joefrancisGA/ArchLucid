import { OPERATOR_HOME_RECENT_REVIEWS_EXAMPLE_ONLY_OUTCOME } from "@/lib/buyer/buyer-polish-copy";
import { isDemoSeededOverviewInjectedRun } from "@/lib/demo-seeded-overview";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import type { OperatorHomeWorkspaceMetricsSnapshot } from "@/lib/operator/operator-home-workspace-metrics";
import type { RunSummary } from "@/types/authority";
import { projectReviewLifecycleForDisplay } from "@/lib/vocabulary/project-review-lifecycle-for-display";

export type FormatOperatorHomeRecentReviewsOutcomeOptions = {
  /** Demo/seeded or static showcase rows only — not tenant-authored reviews. */
  readonly exampleReviewOnly?: boolean;
};

/**
 * One-line portfolio outcome for Recent reviews — committed/active counts plus finding/warning pressure.
 */
export function formatOperatorHomeRecentReviewsOutcome(
  metrics: OperatorHomeWorkspaceMetricsSnapshot,
  options?: FormatOperatorHomeRecentReviewsOutcomeOptions,
): string {
  if (options?.exampleReviewOnly === true) {
    return OPERATOR_HOME_RECENT_REVIEWS_EXAMPLE_ONLY_OUTCOME;
  }

  if (!metrics.hasReviews) {
    return "No reviews in this workspace yet.";
  }

  const committed = metrics.reviewPackagesCommitted;
  const active = metrics.reviewPackagesActive;
  const packagePart =
    projectReviewLifecycleForDisplay({
      committedRunsInScope: committed,
      activeRunsInScope: active,
    }).committedRunsInScopeLabel ?? `${committed} finalized`;

  const pressureParts: string[] = [];

  if (metrics.openFindings > 0) {
    pressureParts.push(
      `${metrics.openFindings} open finding${metrics.openFindings === 1 ? "" : "s"}`,
    );
  }

  if (metrics.governanceWarnings > 0) {
    pressureParts.push(
      `${metrics.governanceWarnings} with approval-check warnings`,
    );
  }

  if (pressureParts.length === 0) {
    return `${packagePart} · no open finding pressure`;
  }

  return `${packagePart} · ${pressureParts.join(" · ")}`;
}

/** True when every list row is a demo/seeded inject or the static showcase sample. */
export function isExampleOnlyOverviewRunList(items: readonly RunSummary[]): boolean {
  if (items.length === 0) {
    return false;
  }

  return items.every(
    (run) =>
      isDemoSeededOverviewInjectedRun(run) || isShowcaseStaticDemoRunId(run.runId ?? ""),
  );
}

/** Tenant-authored rows only — excludes demo inject and the curated showcase sample. */
export function filterTenantOverviewRuns(items: readonly RunSummary[]): RunSummary[] {
  return items.filter(
    (run) =>
      !isDemoSeededOverviewInjectedRun(run) && !isShowcaseStaticDemoRunId(run.runId ?? ""),
  );
}

/** Featured recent-review rows on Overview (full list lives on Architecture packages). */
export const OPERATOR_HOME_RECENT_FEATURED_LIMIT = 2;
