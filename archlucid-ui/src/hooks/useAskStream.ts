"use client";

import { useCallback, useRef, useState } from "react";

import { askArchLucidStream } from "@/lib/api/ask-sse-stream";
import type { AskResponse } from "@/types/conversation";

const TOKEN_FLUSH_MS = 20;

export type AskStreamRequest = {
  threadId?: string;
  runId?: string;
  question: string;
  baseRunId?: string;
  targetRunId?: string;
};

export type UseAskStreamResult = {
  tokens: string;
  isStreaming: boolean;
  error: string | null;
  ask: (
    request: AskStreamRequest,
    signal?: AbortSignal,
  ) => Promise<{ response: AskResponse | null; error: string | null }>;
  reset: () => void;
};

/** Consumes `POST /v1/ask/stream` SSE tokens with a short flush window to limit re-renders (TB-178). */
export function useAskStream(): UseAskStreamResult {
  const [tokens, setTokens] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef("");
  const flushTimerRef = useRef<number | undefined>(undefined);

  const flushPending = useCallback(() => {
    if (pendingRef.current.length === 0) {
      return;
    }

    const chunk = pendingRef.current;
    pendingRef.current = "";
    setTokens((previous) => previous + chunk);
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current !== undefined) {
      return;
    }

    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = undefined;
      flushPending();
    }, TOKEN_FLUSH_MS);
  }, [flushPending]);

  const clearFlushTimer = useCallback(() => {
    if (flushTimerRef.current !== undefined) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = undefined;
    }
  }, []);

  const reset = useCallback(() => {
    clearFlushTimer();
    pendingRef.current = "";
    setTokens("");
    setIsStreaming(false);
    setError(null);
  }, [clearFlushTimer]);

  const ask = useCallback(
    async (
      request: AskStreamRequest,
      signal?: AbortSignal,
    ): Promise<{ response: AskResponse | null; error: string | null }> => {
      clearFlushTimer();
      pendingRef.current = "";
      setTokens("");
      setError(null);
      setIsStreaming(true);

      let streamError: string | null = null;

      const response = await askArchLucidStream(
        request,
        {
          onToken: (text) => {
            pendingRef.current += text;
            scheduleFlush();
          },
          onDone: () => {
            flushPending();
          },
          onError: (detail) => {
            clearFlushTimer();
            pendingRef.current = "";
            streamError = detail;
            setError(detail);
          },
        },
        signal,
      );

      clearFlushTimer();
      flushPending();
      setIsStreaming(false);

      return { response, error: streamError };
    },
    [clearFlushTimer, flushPending, scheduleFlush],
  );

  return { tokens, isStreaming, error, ask, reset };
}
