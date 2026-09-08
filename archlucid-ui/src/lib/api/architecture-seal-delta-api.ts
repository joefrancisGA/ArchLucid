import type { ArchitectureSealDeltaResponse } from "@/types/architecture-seal-delta";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";

const ARCHITECTURES_BASE = "/v1/architectures";

export async function getArchitectureSealDelta(
  architectureId: string,
): Promise<ArchitectureSealDeltaResponse> {
  return apiGetSealedManifestAware<ArchitectureSealDeltaResponse>(
    `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId.trim())}/seal-delta`,
  );
}
