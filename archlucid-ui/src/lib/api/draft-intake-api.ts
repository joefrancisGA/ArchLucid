import type {
  ActorSet,
  BranchDraftRequest,
  BranchDraftResponse,
  DraftBranchQuotaResponse,
  DraftAdmissionResponse,
  DraftIntakeReasonResponse,
  DraftQuestionsResponse,
  DraftRequestDocument,
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

export async function createDraftRequest(
  freeTextIntent: string,
  workflowIntent?: "create-architecture" | "start-review",
  priorRunId?: string | null,
): Promise<DraftRequestResponse> {
  const trimmedPriorRunId = priorRunId?.trim() ?? "";

  return apiPostJson<DraftRequestResponse>(DRAFT_BASE, {
    freeTextIntent: freeTextIntent.trim(),
    ...(workflowIntent !== undefined ? { workflowIntent } : {}),
    ...(trimmedPriorRunId.length > 0 ? { priorRunId: trimmedPriorRunId } : {}),
  });
}

export async function getDraftRequest(
  draftId: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<DraftRequestResponse> {
  return apiGet<DraftRequestResponse>(`${DRAFT_BASE}/${encodeURIComponent(draftId)}`, options);
}

export async function patchDraftRequest(
  draftId: string,
  body: {
    freeTextIntent?: string;
    systemName?: string;
    businessOutcome?: string;
    actorSet?: ActorSet;
    focusedPilotModeEnabled?: boolean;
    workflowIntent?: "create-architecture" | "start-review";
    structuredBrief?: DraftRequestDocument["structuredBrief"];
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

/** Return an admitted draft to drafting so the architecture brief can be edited again. */
export async function reopenDraftRequest(draftId: string): Promise<DraftRequestResponse> {
  return apiPostJson<DraftRequestResponse>(`${DRAFT_BASE}/${encodeURIComponent(draftId)}/reopen`, {});
}

/** Pre-run manifest-free reasoning on an admitted or drafting intake (SAQ-013). */
export async function reasonDraftRequest(
  draftId: string,
  message: string,
): Promise<DraftIntakeReasonResponse> {
  return apiPostJson<DraftIntakeReasonResponse>(
    `${DRAFT_BASE}/${encodeURIComponent(draftId)}/reason`,
    { message: message.trim() },
  );
}

/** Branch quota and estimated run cost for an admitted parent draft (R12). */
export async function getDraftBranchQuota(draftId: string): Promise<DraftBranchQuotaResponse> {
  return apiGet<DraftBranchQuotaResponse>(
    `${DRAFT_BASE}/${encodeURIComponent(draftId)}/branch-quota`,
  );
}

/** Clone an admitted draft with one ceteris-paribus override (R12). */
export async function branchDraftRequest(
  draftId: string,
  body: BranchDraftRequest,
): Promise<BranchDraftResponse> {
  return apiPostJson<BranchDraftResponse>(
    `${DRAFT_BASE}/${encodeURIComponent(draftId)}/branch`,
    body,
  );
}
