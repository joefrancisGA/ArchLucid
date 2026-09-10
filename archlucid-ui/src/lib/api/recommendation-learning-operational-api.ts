import type { LearningProfile } from "@/types/recommendation-learning";
import type {
  RecommendationLearningOperationalStatus,
  RecommendationLearningPreview,
  RecommendationLearningProfileHistoryItem,
  RecommendationLearningRollbackRequest,
} from "@/types/recommendation-learning-operational";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { recommendationLearningMutationBlockedReason } from "@/lib/internal/recommendation-learning-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiGet, apiPostJson, ensureOidcBearerReady, resolveRequest, throwApiRequestError, withCorrelationHeaders } from "./http";

export type RecommendationLearningOpsPageBundle = {
  status: RecommendationLearningOperationalStatus;
  latestProfile: LearningProfile | null;
  history: RecommendationLearningProfileHistoryItem[];
};

export async function fetchRecommendationLearningOpsPageBundle(
  take = 20,
): Promise<RecommendationLearningOpsPageBundle> {
  return apiGet<RecommendationLearningOpsPageBundle>(
    `/v1/recommendation-learning/ops-page?take=${encodeURIComponent(String(take))}`,
  );
}

export async function fetchRecommendationLearningStatus(): Promise<RecommendationLearningOperationalStatus> {
  return apiGet<RecommendationLearningOperationalStatus>("/v1/recommendation-learning/status");
}

export async function previewRecommendationLearningRebuild(): Promise<RecommendationLearningPreview> {
  try {
    return await apiPostJson<RecommendationLearningPreview>("/v1/recommendation-learning/preview", {});
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = recommendationLearningMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function fetchRecommendationLearningHistory(take = 20): Promise<RecommendationLearningProfileHistoryItem[]> {
  return apiGet<RecommendationLearningProfileHistoryItem[]>(
    `/v1/recommendation-learning/history?take=${encodeURIComponent(String(take))}`,
  );
}

export async function rollbackRecommendationLearningProfile(
  request: RecommendationLearningRollbackRequest,
): Promise<LearningProfile> {
  try {
    return await apiPostJson<LearningProfile>("/v1/recommendation-learning/rollback", request);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = recommendationLearningMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Loads persisted profile without recomputing weights. */
export async function loadPersistedRecommendationLearningProfile(): Promise<LearningProfile | null> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest("/v1/recommendation-learning/latest");
  const h = withCorrelationHeaders(headers);
  const response = await fetch(url, { cache: "no-store", headers: h });
  const text = await response.text();

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throwApiRequestError(response, text);
  }

  return JSON.parse(text) as LearningProfile;
}
