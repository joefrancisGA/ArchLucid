import type { LearningProfile } from "@/types/recommendation-learning";

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

export type RecommendationLearningRollbackRequest = {
  profileId: string;
  reason: string;
};
