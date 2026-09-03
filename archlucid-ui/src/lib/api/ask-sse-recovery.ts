import type { AskResponse } from "@/types/conversation";
import { ensureOidcBearerReady, withCorrelationHeaders } from "./http";
import { resolveAskStreamRequest } from "./ask-sse-connect";
import { consumeSseStream } from "./ask-sse-demux";

export type AskStreamHandlers = {
  onToken: (text: string) => void;
  onDone: (response: AskResponse) => void;
  onError: (detail: string) => void;
};

/** Streams Ask answer tokens via `POST /v1/ask/stream` (SSE). Falls back to callers on HTTP errors before the stream opens. */
export async function askArchLucidStream(
  payload: {
    threadId?: string;
    runId?: string;
    question: string;
    baseRunId?: string;
    targetRunId?: string;
  },
  handlers: AskStreamHandlers,
  signal?: AbortSignal,
): Promise<AskResponse | null> {
  await ensureOidcBearerReady();

  const body: Record<string, unknown> = {
    question: payload.question,
  };

  if (payload.threadId?.trim()) body.threadId = payload.threadId.trim();
  if (payload.runId?.trim()) body.runId = payload.runId.trim();
  if (payload.baseRunId?.trim()) body.baseRunId = payload.baseRunId.trim();
  if (payload.targetRunId?.trim()) body.targetRunId = payload.targetRunId.trim();

  const { url, headers } = resolveAskStreamRequest("/v1/ask/stream");
  const h = withCorrelationHeaders(headers);
  h.set("Content-Type", "application/json");

  const response = await fetch(url, {
    method: "POST",
    headers: h,
    cache: "no-store",
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok || response.body === null) {
    const text = await response.text();
    handlers.onError(text.length > 0 ? text : `Ask stream failed (${response.status}).`);

    return null;
  }

  let finalResponse: AskResponse | null = null;

  await consumeSseStream(
    response.body,
    (eventName, data) => {
      if (eventName === "ack") {
        // Early stream open — ignore; tokens follow after server context prepare.
        return;
      }

      if (eventName === "token") {
        try {
          const parsed = JSON.parse(data) as { text?: string };

          if (typeof parsed.text === "string" && parsed.text.length > 0) {
            handlers.onToken(parsed.text);
          }
        } catch {
          /* ignore malformed token frame */
        }

        return;
      }

      if (eventName === "done") {
        try {
          finalResponse = JSON.parse(data) as AskResponse;
          handlers.onDone(finalResponse);
        } catch {
          handlers.onError("Malformed Ask stream completion payload.");
        }

        return;
      }

      if (eventName === "error") {
        try {
          const parsed = JSON.parse(data) as { detail?: string; title?: string };
          const detail = parsed.detail ?? parsed.title ?? data;
          handlers.onError(detail);
        } catch {
          handlers.onError(data);
        }
      }
    },
    signal,
  );

  return finalResponse;
}
