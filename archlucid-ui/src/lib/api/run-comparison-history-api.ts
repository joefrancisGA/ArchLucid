import type { components } from "@/lib/openapi-schemas";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { runComparisonHistoryBlockedReason } from "@/lib/compare/run-comparison-history-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiGet } from "./http";

export type RunComparisonHistoryResponse = components["schemas"]["ComparisonHistoryResponse"];

/** Lists persisted comparison audit rows for a run. */
export async function getRunComparisonHistory(runId: string): Promise<RunComparisonHistoryResponse> {
  try {
    return await apiGet<RunComparisonHistoryResponse>(
      `/v1/architecture/run/${encodeURIComponent(runId)}/comparisons`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = runComparisonHistoryBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
