import type { AskResponse } from "@/types/conversation";
import { getServerApiBaseUrl } from "@/lib/config";
import { getServerUpstreamAuthHeaders } from "@/lib/legacy-arch-env";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator-scope-storage";
import { getScopeHeaders } from "@/lib/scope";
import { ensureOidcBearerReady, getBearerToken, isBrowser, withCorrelationHeaders } from "./http";

export type AskStreamHandlers = {
  onToken: (text: string) => void;
  onDone: (response: AskResponse) => void;
  onError: (detail: string) => void;
};

function resolveAskStreamRequest(path: string): { url: string; headers: HeadersInit } {
  if (isBrowser()) {
    const url = `/api/proxy${path.startsWith("/") ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      Accept: "text/event-stream",
      ...getEffectiveBrowserProxyScopeHeaders(),
    };
    const bearer = getBearerToken();

    if (bearer) {
      headers.Authorization = `Bearer ${bearer}`;
    }

    return { url, headers };
  }

  const base = getServerApiBaseUrl().replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  return {
    url,
    headers: {
      Accept: "text/event-stream",
      ...getScopeHeaders(),
      ...getServerUpstreamAuthHeaders(),
    },
  };
}

/** Parses SSE frames from a byte stream (event + data lines). */
export async function consumeSseStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (eventName: string, data: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "message";
  let dataLines: string[] = [];

  const flushEvent = () => {
    if (dataLines.length === 0) {
      currentEvent = "message";

      return;
    }

    onEvent(currentEvent, dataLines.join("\n"));
    dataLines = [];
    currentEvent = "message";
  };

  try {
    while (true) {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      const { done, value } = await reader.read();

      if (done) {
        flushEvent();
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let lineBreakIndex = buffer.indexOf("\n");

      while (lineBreakIndex >= 0) {
        let line = buffer.slice(0, lineBreakIndex);
        buffer = buffer.slice(lineBreakIndex + 1);

        if (line.endsWith("\r")) {
          line = line.slice(0, -1);
        }

        if (line.length === 0) {
          flushEvent();
        } else if (line.startsWith("event:")) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trimStart());
        }

        lineBreakIndex = buffer.indexOf("\n");
      }
    }
  } finally {
    reader.releaseLock();
  }
}

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
