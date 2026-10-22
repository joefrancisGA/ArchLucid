import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { apiGetSealedManifestAware } from "@/lib/api/api-get-sealed-manifest-aware";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { reviewClarificationQuestionsBlockedReason } from "@/lib/runs/review-clarification-questions-blocked-reason";
import type { ReviewClarificationQuestionsResponse } from "@/lib/review-clarification-questions-types";

export async function getReviewClarificationQuestions(
  runId: string,
  priorRunId?: string | null,
): Promise<ReviewClarificationQuestionsResponse> {
  const trimmedRunId = runId.trim();
  const params = new URLSearchParams();

  if (priorRunId !== undefined && priorRunId !== null && priorRunId.trim().length > 0) {
    params.set("priorRunId", priorRunId.trim());
  }

  const query = params.toString();
  const path =
    query.length > 0
      ? `/v1/architecture/review/${encodeURIComponent(trimmedRunId)}/clarification-questions?${query}`
      : `/v1/architecture/review/${encodeURIComponent(trimmedRunId)}/clarification-questions`;

  try {
    return await apiGetSealedManifestAware<ReviewClarificationQuestionsResponse>(path);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = reviewClarificationQuestionsBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
