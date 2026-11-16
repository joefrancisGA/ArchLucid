import type { components } from "@/lib/openapi-schemas";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { runComparisonHistoryBlockedReason } from "@/lib/compare/run-comparison-history-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { trimRequiredPathSegment } from "./api-boundary-normalization";
import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";

export type RunComparisonHistoryResponse = components["schemas"]["ComparisonHistoryResponse"];

/** Lists persisted comparison audit rows for a run. */
export async function getRunComparisonHistory(runId: string): Promise<RunComparisonHistoryResponse> {
  const normalizedRunId = trimRequiredPathSegment(runId, "runId");

  try {
    return await apiGetSealedManifestAware<RunComparisonHistoryResponse>(
      `/v1/architecture/run/${encodeURIComponent(normalizedRunId)}/comparisons`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = runComparisonHistoryBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
