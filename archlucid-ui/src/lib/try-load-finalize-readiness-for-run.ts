import { getFinalizeReadiness } from "@/lib/api/finalize-readiness";
import { shouldSkipLiveAuthorityRunScopedApi } from "@/lib/operator-static-demo/run-scoped-live-api";
import type { FinalizeReadinessResult } from "@/types/finalize-readiness";

/** Best-effort server readiness for SSR finalize blocked-reason (unified contract). */
export async function tryLoadFinalizeReadinessForRun(
  runId: string,
): Promise<FinalizeReadinessResult | null> {
  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0 || shouldSkipLiveAuthorityRunScopedApi(trimmedRunId)) {
    return null;
  }

  try {
    return await getFinalizeReadiness(trimmedRunId);
  } catch {
    return null;
  }
}
