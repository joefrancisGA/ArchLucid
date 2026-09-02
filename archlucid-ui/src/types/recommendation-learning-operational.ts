import type { components } from "@/lib/openapi-schemas";

export const RECOMMENDATION_LEARNING_CANONICAL_PATH = "/internal/recommendation-learning";

export type RecommendationLearningProfileState = components["schemas"]["RecommendationLearningProfileState"];

export type RecommendationLearningOutcomeEligibility =
  components["schemas"]["RecommendationLearningOutcomeEligibilityBreakdown"];

type RecommendationLearningProfileMetadataSchema =
  components["schemas"]["RecommendationLearningProfileMetadataResponse"];

export type RecommendationLearningProfileMetadata = RecommendationLearningProfileMetadataSchema &
  Required<
    Pick<
      RecommendationLearningProfileMetadataSchema,
      | "profileId"
      | "generatedUtc"
      | "outcomeCount"
      | "algorithmVersion"
      | "profileChecksum"
      | "status"
      | "scopeLabel"
      | "featureSchemaVersion"
      | "buildSource"
      | "eligibleOutcomeCount"
      | "excludedOutcomeCount"
      | "storageLocation"
    >
  >;

type RecommendationLearningOperationalStatusSchema =
  components["schemas"]["RecommendationLearningOperationalStatusResponse"];

export type RecommendationLearningOperationalStatus = Omit<
  RecommendationLearningOperationalStatusSchema,
  "eligibility" | "activeProfile"
> &
  Required<
    Pick<
      RecommendationLearningOperationalStatusSchema,
      | "tenantId"
      | "workspaceId"
      | "projectId"
      | "environmentName"
      | "scopeLabel"
      | "profileState"
      | "eligibleOutcomeCount"
      | "proposedOutcomeCount"
      | "minimumRequiredOutcomes"
      | "rebuildBatchCap"
    >
  > & {
    eligibility: RecommendationLearningOutcomeEligibility;
    activeProfile?: RecommendationLearningProfileMetadata | null;
  };

export type RecommendationLearningValidationCheck =
  components["schemas"]["RecommendationLearningValidationCheck"];

export type RecommendationLearningWeightDelta = components["schemas"]["RecommendationLearningWeightDelta"];

export type LearningProfile = components["schemas"]["RecommendationLearningProfile"];

type RecommendationLearningPreviewSchema = components["schemas"]["RecommendationLearningPreviewResponse"];

export type RecommendationLearningPreview = Omit<
  RecommendationLearningPreviewSchema,
  "proposedProfile" | "weightDeltas" | "validationChecks"
> &
  Required<
    Pick<
      RecommendationLearningPreviewSchema,
      | "sourceRecordCount"
      | "eligibleRecordCount"
      | "buildDurationMs"
      | "correlationId"
    >
  > & {
    proposedProfile: LearningProfile;
    weightDeltas: RecommendationLearningWeightDelta[];
    validationChecks: RecommendationLearningValidationCheck[];
  };

export type RecommendationLearningProfileHistoryItem =
  components["schemas"]["RecommendationLearningProfileHistoryItem"];

export type RecommendationLearningRollbackRequest =
  components["schemas"]["RecommendationLearningRollbackRequest"];

export type RecommendationLearningOpsPageResponse = components["schemas"]["RecommendationLearningOpsPageResponse"];
