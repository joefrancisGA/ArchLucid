import { getLatestLearningProfile } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import type { LearningProfile } from "@/types/recommendation-learning";

export type RecommendationLearningPageServerLoad =
  | { kind: "redirect-demo" }
  | { kind: "ready"; profile: LearningProfile | null; failure: ApiLoadFailureState | null };

export async function loadRecommendationLearningPageData(): Promise<RecommendationLearningPageServerLoad> {
  if (isNextPublicDemoMode()) {
    return { kind: "redirect-demo" };
  }

  try {
    const profile = await getLatestLearningProfile();

    return { kind: "ready", profile, failure: null };
  } catch (e: unknown) {
    return { kind: "ready", profile: null, failure: toApiLoadFailure(e) };
  }
}
