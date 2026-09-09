import type { components } from "@/lib/openapi-schemas";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";

export type ExportRecordDiffResponse = components["schemas"]["ExportRecordDiffResponse"];

/** Pairwise diff between two persisted export audit rows. */
export async function compareExportRecords(
  leftExportRecordId: string,
  rightExportRecordId: string,
): Promise<ExportRecordDiffResponse> {
  const query = new URLSearchParams({
    leftExportRecordId: leftExportRecordId.trim(),
    rightExportRecordId: rightExportRecordId.trim(),
  });

  return apiGetSealedManifestAware<ExportRecordDiffResponse>(
    `/v1/architecture/review/exports/compare?${query.toString()}`,
  );
}
