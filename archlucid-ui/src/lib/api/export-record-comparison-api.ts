import type { components } from "@/lib/openapi-schemas";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";

export type ExportRecordComparisonHistoryResponse = components["schemas"]["ComparisonHistoryResponse"];

/** Lists persisted comparison audit rows linked to one export record. */
export async function getExportRecordComparisonHistory(
  exportRecordId: string,
): Promise<ExportRecordComparisonHistoryResponse> {
  return apiGetSealedManifestAware<ExportRecordComparisonHistoryResponse>(
    `/v1/architecture/run/exports/${encodeURIComponent(exportRecordId)}/comparisons`,
  );
}
