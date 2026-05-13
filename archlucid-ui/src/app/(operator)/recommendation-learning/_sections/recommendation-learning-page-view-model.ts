import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { LearningProfile } from "@/types/recommendation-learning";

export type RecommendationLearningPageViewModel = {
  readonly demoMode: boolean;
  readonly profile: LearningProfile | null;
  readonly loading: boolean;
  readonly failure: ApiLoadFailureState | null;
  readonly loadLatest: () => Promise<void>;
  readonly rebuild: () => Promise<void>;
};
