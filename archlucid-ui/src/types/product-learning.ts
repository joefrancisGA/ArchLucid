import type { components } from "@/lib/openapi-schemas";

type ProductLearningDashboardSummaryResponseSchema =
  components["schemas"]["ProductLearningDashboardSummaryResponse"];

export type ProductLearningDashboardSummaryResponse = ProductLearningDashboardSummaryResponseSchema &
  Required<
    Pick<
      ProductLearningDashboardSummaryResponseSchema,
      | "generatedUtc"
      | "tenantId"
      | "workspaceId"
      | "projectId"
      | "totalSignalsInScope"
      | "distinctRunsTouched"
      | "topAggregateCount"
      | "artifactTrendCount"
      | "improvementOpportunityCount"
      | "triageQueueItemCount"
      | "summaryNotes"
    >
  >;

export type ArtifactOutcomeTrend = components["schemas"]["ArtifactOutcomeTrend"];

export type ImprovementOpportunity = components["schemas"]["ImprovementOpportunity"];

export type TriageQueueItem = components["schemas"]["TriageQueueItem"];

type ProductLearningImprovementOpportunitiesResponseSchema =
  components["schemas"]["ProductLearningImprovementOpportunitiesResponse"];

export type ProductLearningImprovementOpportunitiesResponse =
  ProductLearningImprovementOpportunitiesResponseSchema &
    Required<Pick<ProductLearningImprovementOpportunitiesResponseSchema, "generatedUtc">> & {
      opportunities: ImprovementOpportunity[];
    };

type ProductLearningArtifactOutcomeTrendsResponseSchema =
  components["schemas"]["ProductLearningArtifactOutcomeTrendsResponse"];

export type ProductLearningArtifactOutcomeTrendsResponse = ProductLearningArtifactOutcomeTrendsResponseSchema &
  Required<Pick<ProductLearningArtifactOutcomeTrendsResponseSchema, "generatedUtc">> & {
    trends: ArtifactOutcomeTrend[];
  };

type ProductLearningTriageQueueResponseSchema = components["schemas"]["ProductLearningTriageQueueResponse"];

export type ProductLearningTriageQueueResponse = ProductLearningTriageQueueResponseSchema &
  Required<Pick<ProductLearningTriageQueueResponseSchema, "generatedUtc">> & {
    items: TriageQueueItem[];
  };

type ProductLearningDashboardBundleSchema = components["schemas"]["ProductLearningDashboardBundleResponse"];

/** Result of loading all four product-learning slices in parallel (same scope and optional `since`). */
export type ProductLearningDashboardBundle = Omit<
  ProductLearningDashboardBundleSchema,
  "summary" | "opportunities" | "trends" | "triage"
> & {
  summary: ProductLearningDashboardSummaryResponse;
  opportunities: ProductLearningImprovementOpportunitiesResponse;
  trends: ProductLearningArtifactOutcomeTrendsResponse;
  triage: ProductLearningTriageQueueResponse;
};
