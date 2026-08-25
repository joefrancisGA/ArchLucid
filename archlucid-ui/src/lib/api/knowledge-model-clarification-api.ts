import { apiPostJson } from "@/lib/api";

export type ApplyKnowledgeModelClarificationAnswersResponse = {
  appliedCount: number;
  reReviewTriggered?: boolean;
  mergedFindingCount?: number;
  partialScopeDisclaimer?: string | null;
};

/** Applies operator clarification answers onto κ unresolved-question rows for the current run. */
export async function applyKnowledgeModelClarificationAnswers(
  runId: string,
  answers: Record<string, string>,
): Promise<ApplyKnowledgeModelClarificationAnswersResponse> {
  return apiPostJson<ApplyKnowledgeModelClarificationAnswersResponse>(
    `/v1/architecture/review/${encodeURIComponent(runId)}/knowledge-model/clarification-answers`,
    { answers },
  );
}
