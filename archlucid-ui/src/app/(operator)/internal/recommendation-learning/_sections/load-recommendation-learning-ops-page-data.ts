import {
  fetchRecommendationLearningOpsPageBundle,
  loadPersistedRecommendationLearningProfile,
  previewRecommendationLearningRebuild,
  rollbackRecommendationLearningProfile,
} from "@/lib/api/recommendation-learning-operational-api";
import { rebuildLearningProfile } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import type { LearningProfile } from "@/types/recommendation-learning";
import type {
  RecommendationLearningOperationalStatus,
  RecommendationLearningPreview,
  RecommendationLearningProfileHistoryItem,
} from "@/types/recommendation-learning-operational";

export type RecommendationLearningOpsPageServerLoad =
  | { kind: "redirect-demo" }
  | {
      kind: "ready";
      status: RecommendationLearningOperationalStatus | null;
      profile: LearningProfile | null;
      history: RecommendationLearningProfileHistoryItem[];
      failure: ApiLoadFailureState | null;
    };

export async function loadRecommendationLearningOpsPageData(): Promise<RecommendationLearningOpsPageServerLoad> {
  if (isNextPublicDemoMode()) {
    return { kind: "redirect-demo" };
  }

  try {
    const bundle = await fetchRecommendationLearningOpsPageBundle(20);

    return {
      kind: "ready",
      status: bundle.status,
      profile: bundle.latestProfile,
      history: bundle.history,
      failure: null,
    };
  } catch (e: unknown) {
    return { kind: "ready", status: null, profile: null, history: [], failure: toApiLoadFailure(e) };
  }
}

export type RecommendationLearningOpsActions = {
  refresh: () => Promise<void>;
  loadPersisted: () => Promise<void>;
  previewRebuild: () => Promise<RecommendationLearningPreview | null>;
  rebuild: () => Promise<void>;
  rollback: (profileId: string, reason: string) => Promise<void>;
};

export async function executeRecommendationLearningPreview(): Promise<RecommendationLearningPreview> {
  return previewRecommendationLearningRebuild();
}

export async function executeRecommendationLearningRebuild(): Promise<LearningProfile> {
  return rebuildLearningProfile();
}

export async function executeRecommendationLearningRollback(profileId: string, reason: string): Promise<LearningProfile> {
  return rollbackRecommendationLearningProfile({ profileId, reason });
}

export async function reloadRecommendationLearningOpsBundle(): Promise<{
  status: RecommendationLearningOperationalStatus;
  profile: LearningProfile | null;
  history: RecommendationLearningProfileHistoryItem[];
}> {
  const bundle = await fetchRecommendationLearningOpsPageBundle(20);

  return { status: bundle.status, profile: bundle.latestProfile, history: bundle.history };
}

/** Reloads only the persisted profile weights — does not recompute or refresh eligibility counts. */
export async function reloadPersistedRecommendationLearningProfileOnly(): Promise<LearningProfile | null> {
  return loadPersistedRecommendationLearningProfile();
}
