import type { components } from "@/lib/openapi-schemas";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { exportRecordCompareBlockedReason } from "@/lib/exports/export-record-compare-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiGet } from "./http";

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

  try {
    return await apiGet<ExportRecordDiffResponse>(
      `/v1/architecture/review/exports/compare?${query.toString()}`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = exportRecordCompareBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
