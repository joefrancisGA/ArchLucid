import type {
  RecommendationLearningProfileMetadata,
  RecommendationLearningProfileState,
} from "@/types/recommendation-learning-operational-profile-metadata";

export type RecommendationLearningOutcomeEligibility = {
  accepted: number;
  rejected: number;
  deferred: number;
  implemented: number;
  proposedExcluded: number;
  truncatedByBatchCap: number;
};

export type RecommendationLearningOperationalStatus = {
  tenantId: string;
  workspaceId: string;
  projectId: string;
  environmentName: string;
  scopeLabel: string;
  profileState: RecommendationLearningProfileState;
  eligibleOutcomeCount: number;
  proposedOutcomeCount: number;
  minimumRequiredOutcomes: number;
  rebuildBatchCap: number;
  oldestEligibleOutcomeUtc?: string | null;
  newestEligibleOutcomeUtc?: string | null;
  lastAttemptedBuildUtc?: string | null;
  lastBuildResult?: string | null;
  blockingReason?: string | null;
  activeProfile?: RecommendationLearningProfileMetadata | null;
  eligibility: RecommendationLearningOutcomeEligibility;
};
