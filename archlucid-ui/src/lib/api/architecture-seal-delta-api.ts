import type { ArchitectureSealDeltaResponse } from "@/types/architecture-seal-delta";

import { apiGet } from "./http";

const ARCHITECTURES_BASE = "/v1/architectures";

export async function getArchitectureSealDelta(
  architectureId: string,
): Promise<ArchitectureSealDeltaResponse> {
  return apiGet<ArchitectureSealDeltaResponse>(
    `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId.trim())}/seal-delta`,
  );
}
