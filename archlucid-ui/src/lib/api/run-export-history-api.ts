import type { components } from "@/lib/openapi-schemas";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";

export type RunExportHistoryResponse = components["schemas"]["RunExportHistoryResponse"];

/** Loads persisted export audit rows for a run (whitelabel pre-fill, replay lineage). */
export async function getRunExportHistory(runId: string): Promise<RunExportHistoryResponse> {
  return apiGetSealedManifestAware<RunExportHistoryResponse>(
    `/v1/architecture/review/${encodeURIComponent(runId)}/exports`,
  );
}
