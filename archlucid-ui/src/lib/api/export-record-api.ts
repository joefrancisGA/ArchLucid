import type { components } from "@/lib/openapi-schemas";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";

export type RunExportRecordResponse = components["schemas"]["RunExportRecordResponse"];

/** Loads one persisted export audit row by export record id. */
export async function getExportRecord(exportRecordId: string): Promise<RunExportRecordResponse> {
  return apiGetSealedManifestAware<RunExportRecordResponse>(
    `/v1/architecture/review/exports/${encodeURIComponent(exportRecordId)}`,
  );
}
