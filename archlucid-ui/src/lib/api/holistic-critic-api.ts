import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { holisticCriticBlockedReason } from "@/lib/explain/holistic-critic-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiPostJson } from "./http";

export type HolisticCriticInput = {
  focus?: string;
};

export type HolisticCriticResponse = {
  disclaimer: string;
  critiqueMarkdown: string;
};

/** POST /v1/explain/runs/{runId}/holistic-critic — unstructured architecture critique (not persisted). */
export async function generateHolisticCritique(
  runId: string,
  input: HolisticCriticInput = {},
): Promise<HolisticCriticResponse> {
  try {
    return await apiPostJson<HolisticCriticResponse>(
      `/v1/explain/runs/${encodeURIComponent(runId)}/holistic-critic`,
      input,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = holisticCriticBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
