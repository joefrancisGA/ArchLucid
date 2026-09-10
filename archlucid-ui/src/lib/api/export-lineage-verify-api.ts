import type { components } from "@/lib/openapi-schemas";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { exportLineageVerifyBlockedReason } from "@/lib/exports/export-lineage-verify-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";

export type RunExportLineageVerificationResponse =
  components["schemas"]["RunExportLineageVerificationResponse"];

/** Recomputes export lineage verification for a committed run (read-only). */
export async function verifyRunExportLineage(runId: string): Promise<RunExportLineageVerificationResponse> {
  try {
    return await apiGetSealedManifestAware<RunExportLineageVerificationResponse>(
      `/v1/artifacts/runs/${encodeURIComponent(runId)}/export/verify`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = exportLineageVerifyBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
