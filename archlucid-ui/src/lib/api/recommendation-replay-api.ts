import type { LearningProfile } from "@/types/recommendation-learning";
import type { ReplayResponse } from "@/types/authority";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { recommendationLearningMutationBlockedReason } from "@/lib/internal/recommendation-learning-mutation-blocked-reason";
import { reviewReplayMutationBlockedReason } from "@/lib/runs/review-replay-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { ensureOidcBearerReady, resolveRequest, throwApiRequestError, withCorrelationHeaders } from "./http";

export async function rebuildLearningProfile(): Promise<LearningProfile> {
  try {
    await ensureOidcBearerReady();
    const { url, headers } = await resolveRequest("/v1/recommendation-learning/rebuild");
    const h = withCorrelationHeaders(headers);
    h.set("Content-Type", "application/json");
    const response = await fetch(url, {
      method: "POST",
      headers: h,
      cache: "no-store",
    });
    const text = await response.text();

    if (!response.ok) {
      throwApiRequestError(response, text);
    }

    return JSON.parse(text) as LearningProfile;
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = recommendationLearningMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Replays an authority chain for a run using the specified mode (ReconstructOnly, RebuildManifest, RebuildArtifacts). */
export async function replayRun(runId: string, mode: string): Promise<ReplayResponse> {
  try {
    await ensureOidcBearerReady();
    const { url, headers } = await resolveRequest("/v1/authority/replay");
    const h = withCorrelationHeaders(headers);
    h.set("Content-Type", "application/json");
    const response = await fetch(url, {
      method: "POST",
      headers: h,
      cache: "no-store",
      body: JSON.stringify({ runId, mode }),
    });
    const text = await response.text();

    if (!response.ok) {
      throwApiRequestError(response, text);
    }

    return JSON.parse(text) as ReplayResponse;
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = reviewReplayMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
