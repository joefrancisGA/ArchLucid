import type { DraftQuestionsResponse, DraftRequestResponse } from "@/types/draft-intake";

import { apiGet, apiPostJson } from "./http";

const DRAFT_BASE = "/v1/architecture/draft";

export async function getDraftQuestions(draftId: string): Promise<DraftQuestionsResponse> {
  return apiGet<DraftQuestionsResponse>(`${DRAFT_BASE}/${encodeURIComponent(draftId)}/questions`);
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
  return apiPostJson<DraftRequestResponse>(`${DRAFT_BASE}/${encodeURIComponent(draftId)}/answer`, {
    questionKey,
    answer,
    presenterCapture: options?.presenterCapture === true,
    responderLabel: options?.responderLabel,
  });
}

export async function skipDraftQuestion(
  draftId: string,
  questionKey: string,
): Promise<DraftRequestResponse> {
  return apiPostJson<DraftRequestResponse>(`${DRAFT_BASE}/${encodeURIComponent(draftId)}/skip`, {
    questionKey,
  });
}
