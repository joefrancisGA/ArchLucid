import type { components } from "@/lib/openapi-schemas";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { exportRecordBlockedReason } from "@/lib/exports/export-record-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiGet } from "./http";

export type RunExportRecordResponse = components["schemas"]["RunExportRecordResponse"];

/** Loads one persisted export audit row by export record id. */
export async function getExportRecord(exportRecordId: string): Promise<RunExportRecordResponse> {
  try {
    return await apiGet<RunExportRecordResponse>(
      `/v1/architecture/review/exports/${encodeURIComponent(exportRecordId)}`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = exportRecordBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
