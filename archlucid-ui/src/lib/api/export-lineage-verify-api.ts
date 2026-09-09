import type { components } from "@/lib/openapi-schemas";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";

export type RunExportLineageVerificationResponse =
  components["schemas"]["RunExportLineageVerificationResponse"];

/** Recomputes export lineage verification for a committed run (read-only). */
export async function verifyRunExportLineage(runId: string): Promise<RunExportLineageVerificationResponse> {
  return apiGetSealedManifestAware<RunExportLineageVerificationResponse>(
    `/v1/artifacts/runs/${encodeURIComponent(runId)}/export/verify`,
  );
}
