export const RECOMMENDATION_LEARNING_CANONICAL_PATH = "/internal/recommendation-learning";

export type RecommendationLearningProfileState = "NotBuilt" | "InsufficientData" | "Active";

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

export type RecommendationLearningProfileHistoryItem = {
  profileId: string;
  generatedUtc: string;
  outcomeCount: number;
  algorithmVersion: string;
  profileChecksum: string;
  isActive: boolean;
};
