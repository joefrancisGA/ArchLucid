import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { filterTenantOverviewRuns } from "@/lib/operator/operator-home-recent-reviews-outcome";
import {
  countNonArchivedOverviewRuns,
  resolveOperatorHomeTenantScopedReviewTotalCount,
} from "@/lib/operator/operator-home-review-total-resolution";
import type { RunSummary } from "@/types/authority";

/** Reviews snapshot reported by the runs dashboard panel after a client load or header Refresh. */
export type OperatorHomeLiveRunsSnapshot = {
  readonly items: readonly RunSummary[];
  readonly totalCount: number;
};

/** Normalizes live snapshot totals before context consumers merge them onto the SSR dashboard model. */
export function resolveOperatorHomeLiveRunsSnapshotTotalCount(
  items: readonly RunSummary[],
  totalCount?: number,
): number {
  return resolveOperatorHomeTenantScopedReviewTotalCount(items, totalCount);
}

/**
 * Pagination total the runs panel reports into tenant counting and workspace activity.
 * Uplifts omitted/zero API totals from visible active tenant rows, then normalizes through the
 * shared tenant-scoped resolver so archived-only and demo-only pages cannot keep stale metadata.
 */
export function resolveOperatorHomeRunsPanelReportedTotalCount(
  items: readonly RunSummary[],
  loadedTotalCount: number,
): number {
  const normalizedLoaded = Number.isFinite(loadedTotalCount)
    ? Math.max(0, Math.trunc(loadedTotalCount))
    : 0;
  const visibleActiveTenantCount = countNonArchivedOverviewRuns(filterTenantOverviewRuns(items));
  const upliftedTotal = Math.max(normalizedLoaded, visibleActiveTenantCount);

  return resolveOperatorHomeTenantScopedReviewTotalCount(items, upliftedTotal);
}

/**
 * Overlays the client-refreshed reviews snapshot onto the server-rendered dashboard model so every
 * runs-derived home surface (continue rail, hero KPIs, workspace metrics) reflects the same data as
 * the Recent reviews list, instead of the SSR first paint that header Refresh cannot reach.
 */
export function resolveLiveRunsDashboardModel(
  ssrModel: OperatorHomeRunsDashboardModel,
  liveSnapshot: OperatorHomeLiveRunsSnapshot | null | undefined,
): OperatorHomeRunsDashboardModel {
  if (liveSnapshot === null || liveSnapshot === undefined) {
    return ssrModel;
  }

  return {
    ...ssrModel,
    items: [...liveSnapshot.items],
    totalCount: resolveOperatorHomeTenantScopedReviewTotalCount(
      liveSnapshot.items,
      liveSnapshot.totalCount,
      ssrModel.totalCount,
    ),
  };
}
