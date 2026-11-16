import type { components } from "@/lib/openapi-schemas";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { exportRecordCompareBlockedReason } from "@/lib/exports/export-record-compare-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { trimRequiredPathSegment } from "./api-boundary-normalization";

export type ExportRecordDiffResponse = components["schemas"]["ExportRecordDiffResponse"];

/** Pairwise diff between two persisted export audit rows. */
export async function compareExportRecords(
  leftExportRecordId: string,
  rightExportRecordId: string,
): Promise<ExportRecordDiffResponse> {
  const normalizedLeftExportRecordId = trimRequiredPathSegment(leftExportRecordId, "leftExportRecordId");
  const normalizedRightExportRecordId = trimRequiredPathSegment(rightExportRecordId, "rightExportRecordId");
  const query = new URLSearchParams({
    leftExportRecordId: normalizedLeftExportRecordId,
    rightExportRecordId: normalizedRightExportRecordId,
  });

  try {
    return await apiGetSealedManifestAware<ExportRecordDiffResponse>(
      `/v1/architecture/review/exports/compare?${query.toString()}`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = exportRecordCompareBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
