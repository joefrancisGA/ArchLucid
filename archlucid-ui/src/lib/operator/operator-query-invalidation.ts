import { invalidateCorePilotCommitContextCache } from "@/lib/core-pilot-commit-context";
import { invalidateSponsorRoiSummaryCache } from "@/lib/fetch-sponsor-roi-summary-client";
import {
  markOperatorHomeRunsSnapshotStale,
  notifyOperatorHomeLifecycleRefresh,
} from "@/lib/operator/operator-home-lifecycle-notify";
import { invalidatePilotRecentDeltasCache } from "@/lib/pilot-recent-deltas-client";
import { invalidateRunsByProjectPagedCache } from "@/lib/runs-by-project-paged-client";

/** Invalidates operator-home runs, commit context, and delta caches after run lifecycle writes (TB-562). */
export async function invalidateOperatorHomeRunsCaches(): Promise<void> {
  markOperatorHomeRunsSnapshotStale();
  notifyOperatorHomeLifecycleRefresh();

  await Promise.all([
    invalidateRunsByProjectPagedCache(),
    invalidateCorePilotCommitContextCache(),
    invalidatePilotRecentDeltasCache(),
  ]);
}

/** Invalidates sponsor ROI summary after governance disposition or portfolio changes (TB-562). */
export async function invalidateOperatorSponsorRoiCaches(): Promise<void> {
  await invalidateSponsorRoiSummaryCache();
}
