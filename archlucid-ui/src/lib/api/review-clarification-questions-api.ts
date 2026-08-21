import { apiGet } from "@/lib/api/http";
import type { ReviewClarificationQuestionsResponse } from "@/lib/review-clarification-questions-types";

export async function getReviewClarificationQuestions(
  runId: string,
  priorRunId?: string | null,
): Promise<ReviewClarificationQuestionsResponse> {
  const params = new URLSearchParams();
  if (priorRunId !== null && priorRunId !== undefined && priorRunId.trim().length > 0) {
    params.set("priorRunId", priorRunId.trim());
  }
  const query = params.toString();
  const suffix = query.length > 0 ? `?${query}` : "";
  return apiGet<ReviewClarificationQuestionsResponse>(
    `/v1/architecture/review/${encodeURIComponent(runId.trim())}/clarification-questions${suffix}`,
  );
}
