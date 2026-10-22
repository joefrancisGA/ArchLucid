/** Socratic intake draft lifecycle against `/v1/architecture/draft` (ADR 0048). */
import type { APIRequestContext } from "@playwright/test";

import { resolveLiveApiBase } from "./live-api-auth";
import {
  liveAcceptHeaders,
  liveJsonHeaders,
  mergeTenantScope,
  type LiveTenantScopeHeaders,
} from "./live-api-headers";
import { throwIfNotOk } from "./live-api-response";

const DRAFT_BASE = "/v1/architecture/draft";

export type LiveDraftAdmissionResponse = {
  admitted?: boolean;
  draftId?: string;
  status?: string;
};

export type LiveDraftQuestionsResponse = {
  selection?: {
    pendingMustQuestions?: Array<{ questionKey: string; prompt: string }>;
  };
};

export type LiveSubmitDraftResponse = {
  runId?: string;
  status?: string;
};

function draftUrl(draftId: string, suffix = ""): string {
  return `${resolveLiveApiBase()}${DRAFT_BASE}/${encodeURIComponent(draftId)}${suffix}`;
}

/** POST `/v1/architecture/draft` — create a mutable intake draft. */
export async function createDraftRequestLive(
  request: APIRequestContext,
  freeTextIntent: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<{ draftId: string }> {
  const res = await request.post(`${resolveLiveApiBase()}${DRAFT_BASE}`, {
    data: { freeTextIntent },
    headers: mergeTenantScope(liveJsonHeaders(), tenantScope),
  });

  await throwIfNotOk(res, "POST /v1/architecture/draft");

  const body = (await res.json()) as { draftId?: string };

  if (!body.draftId) {
    throw new Error("Create draft response missing draftId");
  }

  return { draftId: body.draftId };
}

/** PATCH `/v1/architecture/draft/{draftId}` — patch intake fields before admission. */
export async function patchDraftRequestLive(
  request: APIRequestContext,
  draftId: string,
  body: Record<string, unknown>,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<void> {
  const res = await request.patch(draftUrl(draftId), {
    data: body,
    headers: mergeTenantScope(liveJsonHeaders(), tenantScope),
  });

  await throwIfNotOk(res, "PATCH /v1/architecture/draft/{draftId}");
}

/** POST `/v1/architecture/draft/{draftId}/admit` */
export async function admitDraftRequestLive(
  request: APIRequestContext,
  draftId: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<LiveDraftAdmissionResponse> {
  const res = await request.post(draftUrl(draftId, "/admit"), {
    data: {},
    headers: mergeTenantScope(liveJsonHeaders(), tenantScope),
  });

  await throwIfNotOk(res, "POST /v1/architecture/draft/{draftId}/admit");

  return res.json() as Promise<LiveDraftAdmissionResponse>;
}

/** GET `/v1/architecture/draft/{draftId}/questions` */
export async function getDraftQuestionsLive(
  request: APIRequestContext,
  draftId: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<LiveDraftQuestionsResponse> {
  const res = await request.get(draftUrl(draftId, "/questions"), {
    headers: mergeTenantScope(liveAcceptHeaders(), tenantScope),
  });

  await throwIfNotOk(res, "GET /v1/architecture/draft/{draftId}/questions");

  return res.json() as Promise<LiveDraftQuestionsResponse>;
}

/** POST `/v1/architecture/draft/{draftId}/skip` */
export async function skipDraftQuestionLive(
  request: APIRequestContext,
  draftId: string,
  questionKey: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<void> {
  const res = await request.post(draftUrl(draftId, "/skip"), {
    data: { questionKey },
    headers: mergeTenantScope(liveJsonHeaders(), tenantScope),
  });

  await throwIfNotOk(res, "POST /v1/architecture/draft/{draftId}/skip");
}

/** POST `/v1/architecture/draft/{draftId}/submit` — spawn architecture run. */
export async function submitDraftRequestLive(
  request: APIRequestContext,
  draftId: string,
  tenantScope?: LiveTenantScopeHeaders | null,
): Promise<LiveSubmitDraftResponse> {
  const res = await request.post(draftUrl(draftId, "/submit"), {
    data: {},
    headers: mergeTenantScope(liveJsonHeaders(), tenantScope),
  });

  await throwIfNotOk(res, "POST /v1/architecture/draft/{draftId}/submit");

  return res.json() as Promise<LiveSubmitDraftResponse>;
}
