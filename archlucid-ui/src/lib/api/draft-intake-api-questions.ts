import type { DraftQuestionsResponse, DraftRequestResponse } from "@/types/draft-intake";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { architectureDraftIntakeMutationBlockedReason } from "@/lib/architecture/architecture-draft-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiPostJson } from "./http";
import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";

const DRAFT_BASE = "/v1/architecture/draft";

export async function getDraftQuestions(draftId: string): Promise<DraftQuestionsResponse> {
  return apiGetSealedManifestAware<DraftQuestionsResponse>(`${DRAFT_BASE}/${encodeURIComponent(draftId)}/questions`);
}

export type AnswerDraftQuestionOptions = {
  readonly presenterCapture?: boolean;
  readonly responderLabel?: string;
};

export async function answerDraftQuestion(
  draftId: string,
  questionKey: string,
  answer: string,
  options?: AnswerDraftQuestionOptions,
): Promise<DraftRequestResponse> {
  try {
    return await apiPostJson<DraftRequestResponse>(`${DRAFT_BASE}/${encodeURIComponent(draftId)}/answer`, {
      questionKey,
      answer,
      presenterCapture: options?.presenterCapture === true,
      responderLabel: options?.responderLabel,
    });
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureDraftIntakeMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function skipDraftQuestion(
  draftId: string,
  questionKey: string,
): Promise<DraftRequestResponse> {
  try {
    return await apiPostJson<DraftRequestResponse>(`${DRAFT_BASE}/${encodeURIComponent(draftId)}/skip`, {
      questionKey,
    });
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureDraftIntakeMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
