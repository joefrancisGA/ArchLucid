import type { DraftQuestionsResponse, DraftRequestResponse } from "@/types/draft-intake";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { architectureDraftIntakeMutationBlockedReason } from "@/lib/architecture/architecture-draft-blocked-reason";
import { architectureDraftQuestionsBlockedReason } from "@/lib/architecture/architecture-draft-list-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiPostJson } from "./http";
import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { trimOptionalText, trimRequiredPathSegment } from "./api-boundary-normalization";

const DRAFT_BASE = "/v1/architecture/draft";

export async function getDraftQuestions(draftId: string): Promise<DraftQuestionsResponse> {
  const normalizedDraftId = trimRequiredPathSegment(draftId, "draftId");

  try {
    return await apiGetSealedManifestAware<DraftQuestionsResponse>(
      `${DRAFT_BASE}/${encodeURIComponent(normalizedDraftId)}/questions`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureDraftQuestionsBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
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
  const normalizedDraftId = trimRequiredPathSegment(draftId, "draftId");

  try {
    return await apiPostJson<DraftRequestResponse>(`${DRAFT_BASE}/${encodeURIComponent(normalizedDraftId)}/answer`, {
      questionKey: trimRequiredPathSegment(questionKey, "questionKey"),
      answer: trimRequiredPathSegment(answer, "answer"),
      presenterCapture: options?.presenterCapture === true,
      responderLabel: trimOptionalText(options?.responderLabel),
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
  const normalizedDraftId = trimRequiredPathSegment(draftId, "draftId");

  try {
    return await apiPostJson<DraftRequestResponse>(`${DRAFT_BASE}/${encodeURIComponent(normalizedDraftId)}/skip`, {
      questionKey: trimRequiredPathSegment(questionKey, "questionKey"),
    });
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureDraftIntakeMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
