import type { components } from "@/lib/openapi-schemas";

import type {
  RecommendationImproveLoopEvidence,
  RecommendationRecord,
} from "@/types/advisory-recommendation-record";

type RecommendationActionResponseSchema = components["schemas"]["RecommendationActionResponse"];

export type RecommendationActionResult = RecommendationActionResponseSchema &
  Required<Pick<RecommendationActionResponseSchema, "recommendation">> & {
    recommendation: RecommendationRecord;
    improveLoop?: RecommendationImproveLoopEvidence | null;
  };
