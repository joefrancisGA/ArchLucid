import type { components } from "@/lib/openapi-schemas";

type ImprovementRecommendationResponseSchema = components["schemas"]["ImprovementRecommendationResponse"];

/** A single AI-generated improvement recommendation (part of an ImprovementPlan). */
export type ImprovementRecommendation = ImprovementRecommendationResponseSchema &
  Required<
    Pick<
      ImprovementRecommendationResponseSchema,
      | "recommendationId"
      | "title"
      | "category"
      | "rationale"
      | "suggestedAction"
      | "urgency"
      | "expectedImpact"
      | "priorityScore"
    >
  >;

type ImprovementPlanResponseSchema = components["schemas"]["ImprovementPlanResponse"];

/** AI-generated improvement plan for a run, with prioritized recommendations. */
export type ImprovementPlan = ImprovementPlanResponseSchema &
  Required<
    Pick<ImprovementPlanResponseSchema, "runId" | "generatedUtc" | "summaryNotes" | "recommendations">
  > & {
    recommendations: ImprovementRecommendation[];
    /** Merged advisoryDefaults from effective policy packs (optional). */
    policyPackAdvisoryDefaults?: Record<string, string>;
  };

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

type RecommendationActionResponseSchema = components["schemas"]["RecommendationActionResponse"];

export type RecommendationActionResult = RecommendationActionResponseSchema &
  Required<Pick<RecommendationActionResponseSchema, "recommendation">> & {
    recommendation: RecommendationRecord;
    improveLoop?: RecommendationImproveLoopEvidence | null;
  };

type AdvisoryRunRecommendationsListResponseSchema =
  components["schemas"]["AdvisoryRunRecommendationsListResponse"];

/** Persisted recommendations list plus optional improve-loop evidence from the run row. */
export type AdvisoryRunRecommendationsList = AdvisoryRunRecommendationsListResponseSchema &
  Required<Pick<AdvisoryRunRecommendationsListResponseSchema, "recommendations">> & {
    recommendations: RecommendationRecord[];
    improveLoopEvidence?: RecommendationImproveLoopEvidence | null;
  };
