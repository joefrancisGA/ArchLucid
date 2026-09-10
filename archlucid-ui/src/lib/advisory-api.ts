import { apiGet, apiPostJson } from "@/lib/api";
import type {
  AdvisoryRunRecommendationsList,
  RecommendationActionResult,
} from "@/types/advisory";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { advisoryRecommendationApplyMutationBlockedReason } from "@/lib/advisory/advisory-recommendation-apply-mutation-blocked-reason";
import { advisoryRunReadBlockedReason } from "@/lib/advisory/advisory-run-read-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

/** Lists persisted recommendation records for a run (approval workflow state). */
export async function listRecommendations(runId: string): Promise<AdvisoryRunRecommendationsList> {
  try {
    return await apiGet<AdvisoryRunRecommendationsList>(
      `/v1/advisory/runs/${encodeURIComponent(runId)}/recommendations`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = advisoryRunReadBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Applies a governance action (Accept, Reject, Defer, Implement) to a recommendation. */
export async function applyRecommendationAction(
  recommendationId: string,
  action: string,
  comment?: string,
  rationale?: string,
): Promise<RecommendationActionResult> {
  try {
    return await apiPostJson<RecommendationActionResult>(
      `/v1/advisory/recommendations/${encodeURIComponent(recommendationId)}/action`,
      {
        action,
        comment: comment ?? null,
        rationale: rationale ?? null,
      },
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = advisoryRecommendationApplyMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
