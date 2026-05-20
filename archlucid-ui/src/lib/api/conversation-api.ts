import type { AskResponse, ConversationMessage, ConversationThread } from "@/types/conversation";
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

/** Lists recent conversation threads for the current scope. */
export async function listConversationThreads(take = 50): Promise<ConversationThread[]> {
  return apiGet(`/v1/conversations?take=${take}`);
}

/** Fetches messages for a conversation thread (most recent first). */
export async function getConversationMessages(threadId: string, take = 200): Promise<ConversationMessage[]> {
  return apiGet(`/v1/conversations/${encodeURIComponent(threadId)}/messages?take=${take}`);
}
