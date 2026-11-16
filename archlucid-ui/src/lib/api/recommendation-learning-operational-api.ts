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

import {
  isRecord,
  positiveIntegerOrDefault,
  recordsOnly,
  requireRecord,
  trimTextFields,
} from "./api-boundary-normalization";
import { apiGet, apiPostJson } from "./http";
import { getLatestLearningProfile } from "./learning-evolution-api";

const DEFAULT_HISTORY_TAKE = 20;

/** Builds the `take` query value; a missing, fractional, or non-positive value falls back to the default. */
function historyTakeQuery(take: number | undefined): string {
  return encodeURIComponent(String(positiveIntegerOrDefault(take, DEFAULT_HISTORY_TAKE)));
}

export type RecommendationLearningOpsPageBundle = {
  status: RecommendationLearningOperationalStatus;
  latestProfile: LearningProfile | null;
  history: RecommendationLearningProfileHistoryItem[];
};

export async function fetchRecommendationLearningOpsPageBundle(
  take = DEFAULT_HISTORY_TAKE,
): Promise<RecommendationLearningOpsPageBundle> {
  const bundle = requireRecord<Record<string, unknown>>(
    await apiGet<unknown>(`/v1/recommendation-learning/ops-page?take=${historyTakeQuery(take)}`),
    "Recommendation learning page",
  );

  // The status is required; a missing profile is a normal state and a malformed history shows as empty.
  return {
    status: requireRecord<RecommendationLearningOperationalStatus>(bundle.status, "Recommendation learning status"),
    latestProfile: isRecord(bundle.latestProfile) ? (bundle.latestProfile as LearningProfile) : null,
    history: recordsOnly<RecommendationLearningProfileHistoryItem>(bundle.history),
  };
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

export async function fetchRecommendationLearningHistory(
  take = DEFAULT_HISTORY_TAKE,
): Promise<RecommendationLearningProfileHistoryItem[]> {
  return recordsOnly<RecommendationLearningProfileHistoryItem>(
    await apiGet<unknown>(`/v1/recommendation-learning/history?take=${historyTakeQuery(take)}`),
  );
}

export async function rollbackRecommendationLearningProfile(
  request: RecommendationLearningRollbackRequest,
): Promise<LearningProfile> {
  const normalizedRequest = trimTextFields(request, ["profileId", "reason"]);

  try {
    return await apiPostJson<LearningProfile>("/v1/recommendation-learning/rollback", normalizedRequest);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = recommendationLearningMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Loads persisted profile without recomputing weights. Shares the validated fetch used by the learning pages. */
export async function loadPersistedRecommendationLearningProfile(): Promise<LearningProfile | null> {
  return getLatestLearningProfile();
}
