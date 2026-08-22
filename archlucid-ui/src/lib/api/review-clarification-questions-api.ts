import { apiGet } from "@/lib/api/http";
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

  return apiGet<ReviewClarificationQuestionsResponse>(path);
}
