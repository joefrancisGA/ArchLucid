import { invalidateCorePilotCommitContextCache } from "@/lib/core-pilot-commit-context";
import { invalidateExecutiveRoiSummaryCache } from "@/lib/fetch-executive-roi-summary-client";
import { invalidatePilotRecentDeltasCache } from "@/lib/pilot-recent-deltas-client";
import { invalidateRunsByProjectPagedCache } from "@/lib/runs-by-project-paged-client";

/** Invalidates operator-home runs, commit context, and delta caches after run lifecycle writes (TB-562). */
export async function invalidateOperatorHomeRunsCaches(): Promise<void> {
  await Promise.all([
    invalidateRunsByProjectPagedCache(),
    invalidateCorePilotCommitContextCache(),
    invalidatePilotRecentDeltasCache(),
  ]);
}

/** Invalidates executive ROI summary after governance disposition or portfolio changes (TB-562). */
export async function invalidateOperatorExecutiveRoiCaches(): Promise<void> {
  await invalidateExecutiveRoiSummaryCache();
}
