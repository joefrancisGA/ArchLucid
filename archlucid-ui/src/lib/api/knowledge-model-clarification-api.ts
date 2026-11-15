import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { clarificationAnswersMutationBlockedReason } from "@/lib/runs/clarification-answers-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiPostJson } from "@/lib/api";

import {
  encodeRequiredPathSegment,
  normalizeCountFields,
  requireRecord,
  trimStringRecord,
} from "./api-boundary-normalization";

export type ApplyKnowledgeModelClarificationAnswersResponse = {
  appliedCount: number;
  reReviewTriggered?: boolean;
  mergedFindingCount?: number;
  partialScopeDisclaimer?: string | null;
};

/** Trims the answers and rejects a submission where every answer is blank. */
function normalizeClarificationAnswers(answers: Record<string, string>): Record<string, string> {
  const normalized = trimStringRecord(answers);

  if (Object.keys(normalized).length === 0) {
    throw new Error("answers is required.");
  }

  return normalized;
}

/** Requires an object response and replaces malformed count values with zero. */
function toClarificationAnswersResponse(raw: unknown): ApplyKnowledgeModelClarificationAnswersResponse {
  const response = requireRecord<Record<string, unknown>>(raw, "Clarification answers");

  return normalizeCountFields(response) as ApplyKnowledgeModelClarificationAnswersResponse;
}

/** Applies operator clarification answers onto κ unresolved-question rows for the current run. */
export async function applyKnowledgeModelClarificationAnswers(
  runId: string,
  answers: Record<string, string>,
): Promise<ApplyKnowledgeModelClarificationAnswersResponse> {
  const encodedRunId = encodeRequiredPathSegment(runId, "runId");
  const normalizedAnswers = normalizeClarificationAnswers(answers);

  try {
    const raw = await apiPostJson<unknown>(
      `/v1/architecture/review/${encodedRunId}/knowledge-model/clarification-answers`,
      { answers: normalizedAnswers },
    );

    return toClarificationAnswersResponse(raw);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = clarificationAnswersMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
