import type {
  BranchDraftRequest,
  BranchDraftResponse,
  DraftAdmissionResponse,
  DraftBranchQuotaResponse,
  DraftIntakeReasonResponse,
  DraftRequestResponse,
  SubmitDraftResponse,
} from "@/types/draft-intake";

import { apiGet, apiPostJson } from "./http";

const DRAFT_BASE = "/v1/architecture/draft";

export async function admitDraftRequest(draftId: string): Promise<DraftAdmissionResponse> {
  return apiPostJson<DraftAdmissionResponse>(
    `${DRAFT_BASE}/${encodeURIComponent(draftId)}/admit`,
    {},
  );
}

export async function submitDraftRequest(
  draftId: string,
  expectedUpdatedUtc?: string | null,
): Promise<SubmitDraftResponse> {
  const body =
    expectedUpdatedUtc === undefined || expectedUpdatedUtc === null
      ? {}
      : { expectedUpdatedUtc };

  return apiPostJson<SubmitDraftResponse>(
    `${DRAFT_BASE}/${encodeURIComponent(draftId)}/submit`,
    body,
  );
}

/** Return an admitted draft to drafting so the architecture brief can be edited again. */
export async function reopenDraftRequest(draftId: string): Promise<DraftRequestResponse> {
  return apiPostJson<DraftRequestResponse>(`${DRAFT_BASE}/${encodeURIComponent(draftId)}/reopen`, {});
}

/** Permanently abandons a draft in Drafting or Admitted — not reversible. */
export async function abandonDraftRequest(draftId: string): Promise<DraftRequestResponse> {
  return apiPostJson<DraftRequestResponse>(`${DRAFT_BASE}/${encodeURIComponent(draftId)}/abandon`, {});
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
