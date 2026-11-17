import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { holisticCriticBlockedReason } from "@/lib/explain/holistic-critic-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiPostJson } from "./http";
import {
  encodeRequiredPathSegment,
  nonNegativeFiniteOrNull,
  trimOptionalText,
} from "./api-boundary-normalization";

export type HolisticCriticInput = {
  focus?: string;
};

export type HolisticCriticResponse = {
  disclaimer: string;
  critiqueMarkdown: string;
  omittedFindingLinesCount?: number;
  omittedThemeSummariesCount?: number;
};

/** POST /v1/explain/runs/{runId}/holistic-critic — unstructured architecture critique (not persisted). */
export async function generateHolisticCritique(
  runId: string,
  input: HolisticCriticInput = {},
): Promise<HolisticCriticResponse> {
  const focus = trimOptionalText(input.focus);
  const request = focus !== undefined ? { focus } : {};

  try {
    const raw = await apiPostJson<unknown>(
      `/v1/explain/runs/${encodeRequiredPathSegment(runId, "runId")}/holistic-critic`,
      request,
    );
    const row = raw !== null && typeof raw === "object" && !Array.isArray(raw)
      ? raw as Record<string, unknown>
      : {};

    const omittedFindingLinesCount = nonNegativeFiniteOrNull(row.omittedFindingLinesCount);
    const omittedThemeSummariesCount = nonNegativeFiniteOrNull(row.omittedThemeSummariesCount);

    return {
      disclaimer: typeof row.disclaimer === "string" ? row.disclaimer : "",
      critiqueMarkdown: typeof row.critiqueMarkdown === "string" ? row.critiqueMarkdown : "",
      ...(omittedFindingLinesCount !== null ? { omittedFindingLinesCount } : {}),
      ...(omittedThemeSummariesCount !== null ? { omittedThemeSummariesCount } : {}),
    };
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = holisticCriticBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
