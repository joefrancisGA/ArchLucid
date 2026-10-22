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
