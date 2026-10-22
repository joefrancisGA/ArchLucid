import type { OperatorEvidenceLimitsExecutionProps } from "@/components/operator/OperatorEvidenceLimitsFooter";

import { getRunDetail } from "@/lib/api";
import { coerceRunDetail } from "@/lib/operator/operator-response-guards";
import { tryStaticRunDetailCriticalPageBundle } from "@/lib/operator/operator-static-demo";
import { shouldSkipLiveAuthorityRunScopedApi } from "@/lib/operator-static-demo/run-scoped-live-api";

/** Loads persisted run execution flags for evidence footers (best-effort; no throw). */
export async function tryLoadRunExecutionFootnote(
  runId: string,
): Promise<OperatorEvidenceLimitsExecutionProps | null> {
  const trimmedRunId = runId.trim();

  try {
    const staticBundle = shouldSkipLiveAuthorityRunScopedApi(trimmedRunId)
      ? tryStaticRunDetailCriticalPageBundle(trimmedRunId)
      : null;
    const detailEnvelope =
      staticBundle !== null
        ? { data: staticBundle.buyerSummary, traceId: null }
        : await getRunDetail(trimmedRunId);
    const coercedDetail = coerceRunDetail(detailEnvelope.data);

    if (!coercedDetail.ok) {
      return null;
    }

    return {
      realModeFellBackToSimulator: coercedDetail.value.run.realModeFellBackToSimulator,
      pilotAoaiDeploymentSnapshot: coercedDetail.value.run.pilotAoaiDeploymentSnapshot ?? null,
    };
  } catch {
    return null;
  }
}
