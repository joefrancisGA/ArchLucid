import type { AskResponse } from "@/types/conversation";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { findingAskBlockedReason } from "@/lib/findings/finding-ask-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiPostJson } from "./http";
import { trimOptionalText, trimRequiredPathSegment } from "./api-boundary-normalization";

/** Body for POST /v1/architecture/finding/{findingId}/ask. */
export type FindingAskRequestPayload = {
  question: string;
  threadId?: string;
};

/** Normalizes 32-char hex finding ids to dashed GUID form for route binding. */
export function findingIdForAskRoute(findingId: string): string {
  const trimmed = findingId.trim();

  if (/^[0-9a-fA-F]{32}$/.test(trimmed)) {
    return `${trimmed.slice(0, 8)}-${trimmed.slice(8, 12)}-${trimmed.slice(12, 16)}-${trimmed.slice(16, 20)}-${trimmed.slice(20)}`;
  }

  return trimmed;
}

/** Grounded Q&A for a single architecture finding. */
export async function askAboutFinding(
  findingId: string,
  payload: FindingAskRequestPayload,
): Promise<AskResponse> {
  const routeId = trimRequiredPathSegment(findingIdForAskRoute(findingId), "findingId");
  const body: Record<string, unknown> = {
    question: trimRequiredPathSegment(payload.question, "question"),
  };
  const threadId = trimOptionalText(payload.threadId);

  if (threadId !== undefined) {
    body.threadId = threadId;
  }

  try {
    return await apiPostJson<AskResponse>(`/v1/architecture/finding/${encodeURIComponent(routeId)}/ask`, body);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = findingAskBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
