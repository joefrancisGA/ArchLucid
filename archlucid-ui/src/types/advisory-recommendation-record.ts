import type { components } from "@/lib/openapi-schemas";

type RecommendationRecordResponseSchema = components["schemas"]["RecommendationRecordResponse"];

/** Persisted recommendation with governance workflow state (Change 36). */
export type RecommendationRecord = Omit<
  RecommendationRecordResponseSchema &
    Required<
      Pick<
        RecommendationRecordResponseSchema,
        | "recommendationId"
        | "tenantId"
        | "workspaceId"
        | "projectId"
        | "runId"
        | "title"
        | "category"
        | "rationale"
        | "suggestedAction"
        | "urgency"
        | "expectedImpact"
        | "priorityScore"
        | "status"
        | "createdUtc"
        | "lastUpdatedUtc"
      >
    >,
  "sourceEvidenceLinks"
> & {
  sourceEvidenceLinks?: RecommendationSourceEvidenceLink[];
};

export type RecommendationSourceEvidenceLink =
  components["schemas"]["RecommendationSourceEvidenceLink"] & {
    kind: "finding" | "manifestSection";
    id: string;
  };

export type RecommendationImproveLoopEvidence =
  components["schemas"]["RecommendationImproveLoopEvidenceResponse"];

type AdvisoryRunRecommendationsListResponseSchema =
  components["schemas"]["AdvisoryRunRecommendationsListResponse"];

/** Persisted recommendations list plus optional improve-loop evidence from the run row. */
export type AdvisoryRunRecommendationsList = AdvisoryRunRecommendationsListResponseSchema &
  Required<Pick<AdvisoryRunRecommendationsListResponseSchema, "recommendations">> & {
    recommendations: RecommendationRecord[];
    improveLoopEvidence?: RecommendationImproveLoopEvidence | null;
  };
