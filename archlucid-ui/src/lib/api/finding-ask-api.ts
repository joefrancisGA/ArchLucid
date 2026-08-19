import type { AskResponse } from "@/types/conversation";

import { apiPostJson } from "./http";

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
  const routeId = findingIdForAskRoute(findingId);
  const body: Record<string, unknown> = {
    question: payload.question,
  };

  if (payload.threadId !== undefined && payload.threadId.trim().length > 0) {
    body.threadId = payload.threadId.trim();
  }

  return apiPostJson<AskResponse>(`/v1/architecture/finding/${encodeURIComponent(routeId)}/ask`, body);
}
