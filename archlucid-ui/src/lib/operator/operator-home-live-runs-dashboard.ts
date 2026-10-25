import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import type { RunSummary } from "@/types/authority";

/** Reviews snapshot reported by the runs dashboard panel after a client load or header Refresh. */
export type OperatorHomeLiveRunsSnapshot = {
  readonly items: readonly RunSummary[];
  readonly totalCount: number;
};

function resolveLiveRunsDashboardTotalCount(
  liveTotalCount: number,
  ssrTotalCount: number,
  liveItemCount: number,
): number {
  const normalizedSsrTotal = Number.isFinite(ssrTotalCount) ? Math.max(0, Math.trunc(ssrTotalCount)) : 0;
  const liveTotalIsFinite = Number.isFinite(liveTotalCount);

  const resolved = liveTotalIsFinite
    ? Math.max(0, Math.trunc(liveTotalCount))
    : normalizedSsrTotal;

  if (liveItemCount > 0) {
    const upliftedTotal = Math.max(liveItemCount, normalizedSsrTotal);

    if (!liveTotalIsFinite || liveTotalCount === 0) {
      return Math.max(upliftedTotal, resolved);
    }
  }

  return resolved;
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
    totalCount: resolveLiveRunsDashboardTotalCount(
      liveSnapshot.totalCount,
      ssrModel.totalCount,
      liveSnapshot.items.length,
    ),
  };
}
