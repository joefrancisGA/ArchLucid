import { filterTenantOverviewRuns } from "@/lib/operator/operator-home-recent-reviews-outcome";
import type { RunSummary } from "@/types/authority";

/** Non-archived rows on the current overview page — stale-total uplift must not count sealed/archived rows. */
export function countNonArchivedOverviewRuns(items: readonly RunSummary[]): number {
  let count = 0;

  for (const run of items) {
    if (run.isArchived !== true) {
      count += 1;
    }
  }

  return count;
}

/** Aligns live dashboard totals with workspace metrics when API metadata is stale or undercounted. */
export function resolveOperatorHomeReviewTotalCount(
  reportedTotalCount: number,
  ssrTotalCount: number,
  visibleNonArchivedItemCount: number,
  onPageItemCount = 0,
): number {
  const normalizedOnPageItemCount = Number.isFinite(onPageItemCount)
    ? Math.max(0, Math.trunc(onPageItemCount))
    : 0;
  const normalizedSsrTotal = Number.isFinite(ssrTotalCount) ? Math.max(0, Math.trunc(ssrTotalCount)) : 0;
  const reportedTotalIsFinite = Number.isFinite(reportedTotalCount);

  const resolved = reportedTotalIsFinite
    ? Math.max(0, Math.trunc(reportedTotalCount))
    : normalizedSsrTotal;

  if (visibleNonArchivedItemCount === 0 && normalizedOnPageItemCount > 0) {
    return 0;
  }

  if (visibleNonArchivedItemCount > 0) {
    const upliftedTotal = Math.max(visibleNonArchivedItemCount, normalizedSsrTotal);

    if (!reportedTotalIsFinite || reportedTotalCount === 0) {
      return Math.max(upliftedTotal, resolved);
    }

    if (reportedTotalCount > 0 && resolved < visibleNonArchivedItemCount) {
      return Math.max(upliftedTotal, resolved);
    }
  }

  return resolved;
}

/** Tenant-scoped home totals: TB-1039 demo-only pages must not inherit workspace pagination metadata. */
export function resolveOperatorHomeTenantScopedReviewTotalCount(
  overviewItems: readonly RunSummary[],
  reportedTotalCount?: number,
  ssrTotalCount = 0,
): number {
  const tenantItems = filterTenantOverviewRuns(overviewItems);
  const visibleActiveTenantCount = countNonArchivedOverviewRuns(tenantItems);

  if (
    tenantItems.length === 0
    && visibleActiveTenantCount === 0
    && overviewItems.length > 0
  ) {
    return 0;
  }

  const reportedTotal =
    reportedTotalCount === undefined ? visibleActiveTenantCount : reportedTotalCount;

  return resolveOperatorHomeReviewTotalCount(
    reportedTotal,
    ssrTotalCount,
    visibleActiveTenantCount,
    tenantItems.length,
  );
}
