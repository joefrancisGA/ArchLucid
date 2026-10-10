import type { ArchitectureSealDeltaResponse } from "@/types/architecture-seal-delta";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { architectureSealDeltaBlockedReason } from "@/lib/architecture/architecture-seal-delta-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";

const ARCHITECTURES_BASE = "/v1/architectures";

export async function getArchitectureSealDelta(
  architectureId: string,
): Promise<ArchitectureSealDeltaResponse> {
  try {
    return await apiGetSealedManifestAware<ArchitectureSealDeltaResponse>(
      `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId.trim())}/seal-delta`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureSealDeltaBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
