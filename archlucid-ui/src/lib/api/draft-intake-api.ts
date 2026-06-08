import type {
  ActorSet,
  DraftAdmissionResponse,
  DraftQuestionsResponse,
  DraftRequestResponse,
  SubmitDraftResponse,
} from "@/types/draft-intake";

import { apiGet, apiPatchJson, apiPostJson } from "./http";

const DRAFT_BASE = "/v1/architecture/draft";

/** Default asserted actor so structural admission can pass without a separate actor UI step. */
export function buildDefaultActorSet(): ActorSet {
  return {
    actors: [
      {
        label: "Primary operator",
        kind: "Human",
        trustOrigin: "Internal",
        contract: "Sync",
        origin: "Asserted",
        confidence: 100,
      },
    ],
  };
}

export async function createDraftRequest(freeTextIntent: string): Promise<DraftRequestResponse> {
  return apiPostJson<DraftRequestResponse>(DRAFT_BASE, { freeTextIntent: freeTextIntent.trim() });
}

export async function getDraftRequest(draftId: string): Promise<DraftRequestResponse> {
  return apiGet<DraftRequestResponse>(`${DRAFT_BASE}/${encodeURIComponent(draftId)}`);
}

export async function patchDraftRequest(
  draftId: string,
  body: {
    freeTextIntent?: string;
    systemName?: string;
    businessOutcome?: string;
    actorSet?: ActorSet;
  },
): Promise<DraftRequestResponse> {
  return apiPatchJson<DraftRequestResponse>(`${DRAFT_BASE}/${encodeURIComponent(draftId)}`, body);
}

export async function admitDraftRequest(draftId: string): Promise<DraftAdmissionResponse> {
  return apiPostJson<DraftAdmissionResponse>(
    `${DRAFT_BASE}/${encodeURIComponent(draftId)}/admit`,
    {},
  );
}

export async function getDraftQuestions(draftId: string): Promise<DraftQuestionsResponse> {
  return apiGet<DraftQuestionsResponse>(`${DRAFT_BASE}/${encodeURIComponent(draftId)}/questions`);
}

export async function answerDraftQuestion(
  draftId: string,
  questionKey: string,
  answer: string,
): Promise<DraftRequestResponse> {
  return apiPostJson<DraftRequestResponse>(`${DRAFT_BASE}/${encodeURIComponent(draftId)}/answer`, {
    questionKey,
    answer,
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

export async function submitDraftRequest(draftId: string): Promise<SubmitDraftResponse> {
  return apiPostJson<SubmitDraftResponse>(`${DRAFT_BASE}/${encodeURIComponent(draftId)}/submit`, {});
}
