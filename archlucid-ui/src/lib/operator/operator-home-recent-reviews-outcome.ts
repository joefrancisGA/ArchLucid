import {
  deriveRunsDashboardTabCounts,
  type RunsDashboardTabCounts,
} from "@/components/operator-home/runs-dashboard-helpers";
import { formatOperatorHomeApprovalCheckWarningCount } from "@/lib/operator/operator-home-approval-check-warning-copy";
import { OPERATOR_HOME_RECENT_REVIEWS_EXAMPLE_ONLY_OUTCOME } from "@/lib/buyer/buyer-polish-copy";
import { isDemoSeededOverviewInjectedRun } from "@/lib/demo-seeded-overview";
import { isShowcaseSampleOfAnyKind } from "@/lib/demo-run-canonical";
import type { OperatorHomeWorkspaceMetricsSnapshot } from "@/lib/operator/operator-home-workspace-metrics";
import type { RunSummary } from "@/types/authority";

export type FormatOperatorHomeRecentReviewsOutcomeOptions = {
  /** Demo/seeded or static showcase rows only — not tenant-authored reviews. */
  readonly exampleReviewOnly?: boolean;
  /** Featured recent-review rows visible in the preview list. */
  readonly visibleCount?: number;
};

/**
 * One-line portfolio outcome for Recent reviews — population, lifecycle, pressure, and preview cap.
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

  const parts: string[] = [];
  const total = metrics.reviewPackagesTotal;
  parts.push(`${total} review${total === 1 ? "" : "s"}`);

  if (metrics.reviewPackagesCommitted > 0) {
    parts.push(`${metrics.reviewPackagesCommitted} finalized`);
  }

  if (metrics.reviewPackagesActive > 0) {
    parts.push(`${metrics.reviewPackagesActive} active`);
  }

  if (metrics.openFindings > 0) {
    parts.push(`${metrics.openFindings} open finding${metrics.openFindings === 1 ? "" : "s"}`);
  } else {
    parts.push("no open findings");
  }

  if (metrics.governanceWarnings > 0) {
    parts.push(`with ${formatOperatorHomeApprovalCheckWarningCount(metrics.governanceWarnings)}`);
  }

  if (options?.visibleCount !== undefined) {
    parts.push(`showing ${options.visibleCount}`);
  }

  return parts.join(" · ");
}

/** True when every list row is a demo/seeded inject or the static showcase sample. */
export function isExampleOnlyOverviewRunList(items: readonly RunSummary[]): boolean {
  if (items.length === 0) {
    return false;
  }

  return items.every(
    (run) =>
      isDemoSeededOverviewInjectedRun(run) || isShowcaseSampleOfAnyKind(run.runId ?? ""),
  );
}

/** Tenant-authored rows only — excludes demo inject and the curated showcase sample. */
export function filterTenantOverviewRuns(items: readonly RunSummary[]): RunSummary[] {
  return items.filter(
    (run) =>
      !isDemoSeededOverviewInjectedRun(run) && !isShowcaseSampleOfAnyKind(run.runId ?? ""),
  );
}

/** Featured recent-review rows on Overview (full list lives on Architecture packages). */
export const OPERATOR_HOME_RECENT_FEATURED_LIMIT = 2;

export type HomePreviewTabCounts = RunsDashboardTabCounts & {
  readonly recentVisibleCount: number;
  readonly recentTotalCount: number;
};

export type DeriveHomePreviewTabCountsInput = {
  readonly previewItems: readonly RunSummary[];
  /** When the buyer proof card already names the showcase sample, omit that row from tab counts. */
  readonly excludeShowcaseRunId?: string | undefined;
};

/**
 * Tab counts for the home recent-reviews preview — uses deduped preview rows and caps the
 * Recent tab at the featured limit so labels read `Recent (2 of N)` instead of a silent cap.
 */
export function deriveHomePreviewTabCounts(input: DeriveHomePreviewTabCountsInput): HomePreviewTabCounts {
  const listItems =
    input.excludeShowcaseRunId !== undefined
      ? input.previewItems.filter((run) => run.runId !== input.excludeShowcaseRunId)
      : input.previewItems;
  const baseCounts = deriveRunsDashboardTabCounts(listItems);
  const recentTotalCount = listItems.length;
  const recentVisibleCount = Math.min(listItems.length, OPERATOR_HOME_RECENT_FEATURED_LIMIT);

  return {
    ...baseCounts,
    all: recentVisibleCount,
    recentVisibleCount,
    recentTotalCount,
  };
}
