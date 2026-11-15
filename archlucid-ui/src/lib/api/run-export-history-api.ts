import type { components } from "@/lib/openapi-schemas";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { runExportHistoryBlockedReason } from "@/lib/exports/run-export-history-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { trimRequiredPathSegment } from "./api-boundary-normalization";

export type RunExportHistoryResponse = components["schemas"]["RunExportHistoryResponse"];

/** Loads persisted export audit rows for a run (whitelabel pre-fill, replay lineage). */
export async function getRunExportHistory(runId: string): Promise<RunExportHistoryResponse> {
  const normalizedRunId = trimRequiredPathSegment(runId, "runId");

  try {
    return await apiGetSealedManifestAware<RunExportHistoryResponse>(
      `/v1/architecture/review/${encodeURIComponent(normalizedRunId)}/exports`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = runExportHistoryBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
