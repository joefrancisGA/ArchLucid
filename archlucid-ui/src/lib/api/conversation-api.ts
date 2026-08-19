import type { AskResponse, ConversationMessage, ConversationThread } from "@/types/conversation";
import type { PagedResponse } from "@/types/pagination";
import { apiGet, apiPostJson } from "./http";

export { askArchLucidStream } from "./ask-sse-stream";
export type { AskStreamHandlers } from "./ask-sse-stream";

/** Sends a natural-language question to the ArchLucid conversational AI endpoint. */
export async function askArchLucid(payload: {
  threadId?: string;
  runId?: string;
  question: string;
  baseRunId?: string;
  targetRunId?: string;
}): Promise<AskResponse> {
  const body: Record<string, unknown> = {
    question: payload.question,
  };
  if (payload.threadId?.trim()) body.threadId = payload.threadId.trim();
  if (payload.runId?.trim()) body.runId = payload.runId.trim();
  if (payload.baseRunId?.trim()) body.baseRunId = payload.baseRunId.trim();
  if (payload.targetRunId?.trim()) body.targetRunId = payload.targetRunId.trim();

  return apiPostJson<AskResponse>("/v1/ask", body);
}

/** Loads ComparisonNarrative via POST /v1/ask (base + target runs, advisory prompt). */
export async function fetchComparisonNarrativeViaAsk(
  baseRunId: string,
  targetRunId: string,
): Promise<string | null> {
  const response = await askArchLucid({
    runId: targetRunId,
    baseRunId,
    targetRunId,
    question:
      "Summarize the most important architectural change between these two runs for an sponsor audience.",
  });

  const narrative = response.comparisonNarrative?.trim();
  return narrative && narrative.length > 0 ? narrative : null;
}

/**
 * Normalizes GET /v1/conversations payloads to a thread array.
 * The API always returns {@link PagedResponse}; older clients mistakenly treated the body as a bare array.
 */
export function conversationThreadsFromListResponse(
  payload: PagedResponse<ConversationThread> | ConversationThread[] | null | undefined,
): ConversationThread[] {
  if (Array.isArray(payload)) {
    return payload.filter((thread): thread is ConversationThread => thread != null && typeof thread.threadId === "string");
  }

  if (payload == null || !Array.isArray(payload.items)) {
    return [];
  }

  return payload.items.filter(
    (thread): thread is ConversationThread => thread != null && typeof thread.threadId === "string",
  );
}

/** Lists recent conversation threads for the current scope. */
export async function listConversationThreads(take = 50): Promise<ConversationThread[]> {
  const payload = await apiGet<PagedResponse<ConversationThread> | ConversationThread[]>(
    `/v1/conversations?take=${take}`,
  );

  return conversationThreadsFromListResponse(payload);
}

/** Fetches messages for a conversation thread (most recent first). */
export async function getConversationMessages(threadId: string, take = 200): Promise<ConversationMessage[]> {
  return apiGet(`/v1/conversations/${encodeURIComponent(threadId)}/messages?take=${take}`);
}
