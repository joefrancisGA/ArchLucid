import type { components } from "@/lib/openapi-schemas";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { exportRecordComparisonHistoryBlockedReason } from "@/lib/compare/export-record-comparison-history-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiGet } from "./http";

export type ExportRecordComparisonHistoryResponse = components["schemas"]["ComparisonHistoryResponse"];

/** Lists persisted comparison audit rows linked to one export record. */
export async function getExportRecordComparisonHistory(
  exportRecordId: string,
): Promise<ExportRecordComparisonHistoryResponse> {
  try {
    return await apiGet<ExportRecordComparisonHistoryResponse>(
      `/v1/architecture/run/exports/${encodeURIComponent(exportRecordId)}/comparisons`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = exportRecordComparisonHistoryBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
