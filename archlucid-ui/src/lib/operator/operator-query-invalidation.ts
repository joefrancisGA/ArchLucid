import { invalidateCorePilotCommitContextCache } from "@/lib/core-pilot-commit-context";
import { invalidateSponsorDashboardBundleCache } from "@/lib/fetch-sponsor-dashboard-bundle-client";
import { invalidateSponsorRoiSummaryCache } from "@/lib/fetch-sponsor-roi-summary-client";
import {
  markOperatorHomeRunsSnapshotStale,
  notifyOperatorHomeLifecycleRefresh,
} from "@/lib/operator/operator-home-lifecycle-notify";
import { invalidatePilotRecentDeltasCache } from "@/lib/pilot-recent-deltas-client";
import { invalidateRunsByProjectPagedCache } from "@/lib/runs-by-project-paged-client";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

/** Invalidates operator-home runs, commit context, and delta caches after run lifecycle writes (TB-562). */
export async function invalidateOperatorHomeRunsCaches(): Promise<void> {
  markOperatorHomeRunsSnapshotStale();
  notifyOperatorHomeLifecycleRefresh();

  await Promise.all([
    invalidateRunsByProjectPagedCache(),
    invalidateCorePilotCommitContextCache(),
    invalidatePilotRecentDeltasCache(),
    getOperatorQueryClient().invalidateQueries({ queryKey: operatorQueryKeys.userAttentionSummary }),
  ]);
}

/** Invalidates sponsor ROI summary and dashboard bundle after portfolio or demo seed changes (TB-562). */
export async function invalidateOperatorSponsorRoiCaches(): Promise<void> {
  await Promise.all([invalidateSponsorRoiSummaryCache(), invalidateSponsorDashboardBundleCache()]);
}
