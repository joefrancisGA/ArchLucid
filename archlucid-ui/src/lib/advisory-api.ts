import { apiGet, apiPostJson } from "@/lib/api";
import type { RecommendationActionResult, RecommendationRecord } from "@/types/advisory";

/** Lists persisted recommendation records for a run (governance workflow state). */
export async function listRecommendations(runId: string): Promise<RecommendationRecord[]> {
  return apiGet<RecommendationRecord[]>(
    `/v1/advisory/runs/${encodeURIComponent(runId)}/recommendations`,
  );
}

/** Applies a governance action (Accept, Reject, Defer, Implement) to a recommendation. */
export async function applyRecommendationAction(
  recommendationId: string,
  action: string,
  comment?: string,
  rationale?: string,
): Promise<RecommendationActionResult> {
  return apiPostJson<RecommendationActionResult>(
    `/v1/advisory/recommendations/${encodeURIComponent(recommendationId)}/action`,
    {
      action,
      comment: comment ?? null,
      rationale: rationale ?? null,
    },
  );
}
