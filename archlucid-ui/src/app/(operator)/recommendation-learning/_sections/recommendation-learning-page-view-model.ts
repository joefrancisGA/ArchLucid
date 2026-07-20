import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { LearningProfile } from "@/types/recommendation-learning";

export type RecommendationLearningPageViewModel = {
  readonly profile: LearningProfile | null;
  readonly loading: boolean;
  readonly isRebuilding: boolean;
  readonly failure: ApiLoadFailureState | null;
  readonly loadLatest: () => Promise<void>;
  readonly rebuild: () => Promise<void>;
  /** Rebuild hits an ExecuteAuthority endpoint; the nav item and profile GET stay ReadAuthority. */
  readonly canMutate: boolean;
};
