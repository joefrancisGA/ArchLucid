import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import type { RunSummary } from "@/types/authority";

/** Reviews snapshot reported by the runs dashboard panel after a client load or header Refresh. */
export type OperatorHomeLiveRunsSnapshot = {
  readonly items: readonly RunSummary[];
  readonly totalCount: number;
};

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
    totalCount: liveSnapshot.totalCount,
  };
}
