import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { clarificationAnswersMutationBlockedReason } from "@/lib/runs/clarification-answers-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

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
  try {
    return await apiPostJson<ApplyKnowledgeModelClarificationAnswersResponse>(
      `/v1/architecture/review/${encodeURIComponent(runId)}/knowledge-model/clarification-answers`,
      { answers },
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = clarificationAnswersMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
