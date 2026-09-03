import type { LearningProfile } from "@/types/recommendation-learning";

export const RECOMMENDATION_LEARNING_CANONICAL_PATH = "/internal/recommendation-learning";

export type RecommendationLearningProfileState = "NotBuilt" | "InsufficientData" | "Active";

export type RecommendationLearningOutcomeEligibility = {
  accepted: number;
  rejected: number;
  deferred: number;
  implemented: number;
  proposedExcluded: number;
  truncatedByBatchCap: number;
};

export type RecommendationLearningProfileMetadata = {
  profileId: string;
  generatedUtc: string;
  outcomeCount: number;
  algorithmVersion: string;
  profileChecksum: string;
  status: string;
  scopeLabel: string;
  featureSchemaVersion: string;
  createdBy?: string | null;
  buildSource: string;
  lastActivatedUtc?: string | null;
  eligibleOutcomeCount: number;
  excludedOutcomeCount: number;
  sourceDataStartUtc?: string | null;
  sourceDataEndUtc?: string | null;
  buildDurationMs?: number | null;
  storageLocation: string;
  lastValidationResult?: string | null;
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

export type RecommendationLearningValidationCheck = {
  name: string;
  result: string;
  detail: string;
};

export type RecommendationLearningWeightDelta = {
  featureGroup: string;
  feature: string;
  currentWeight: number;
  proposedWeight: number;
  absoluteDelta: number;
  percentageDelta: number;
  observationCount: number;
  confidence: number;
  fallbackUsed: boolean;
};

export type RecommendationLearningPreview = {
  proposedProfile: LearningProfile;
  weightDeltas: RecommendationLearningWeightDelta[];
  validationChecks: RecommendationLearningValidationCheck[];
  sourceRecordCount: number;
  eligibleRecordCount: number;
  sourceDataStartUtc?: string | null;
  sourceDataEndUtc?: string | null;
  buildDurationMs: number;
  correlationId: string;
};

export type RecommendationLearningProfileHistoryItem = {
  profileId: string;
  generatedUtc: string;
  outcomeCount: number;
  algorithmVersion: string;
  profileChecksum: string;
  isActive: boolean;
};

export type RecommendationLearningRollbackRequest = {
  profileId: string;
  reason: string;
};
