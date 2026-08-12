"use client";

import { useEffect, useRef, useState } from "react";

import { isDocumentHidden } from "@/lib/document-visibility";
import {
  RUN_SUMMARY_FALLBACK_POLL_MS,
  shouldRunRunSummaryFallbackPoll,
  type RunSummaryStreamPhase,
} from "@/lib/runs/run-summary-stream-poll-policy";
import { getRunSummary } from "@/lib/api";
import type { RunSummary } from "@/types/authority";

export type { RunSummaryStreamPhase };

export type UseRunSummaryStreamResult = {
  summary: RunSummary | null;
  streamPhase: RunSummaryStreamPhase;
  sseConnected: boolean;
};

/**
 * Live run summary updates via SSE (`GET /v1/authority/reviews/{id}/events` through `/api/proxy`), with HTTP polling fallback.
 */
export function useRunSummaryStream(
  runId: string | null,
  options: { enabled: boolean; initialSummary?: RunSummary | null; retryToken?: number },
): UseRunSummaryStreamResult {
  const initial = options.initialSummary ?? null;
  const retryToken = options.retryToken ?? 0;
  const [summary, setSummary] = useState<RunSummary | null>(initial);
  const [streamPhase, setStreamPhase] = useState<RunSummaryStreamPhase>("streaming");
  const [sseConnected, setSseConnected] = useState(false);
  const fallbackStartedRef = useRef(false);
  const fallbackIntervalRef = useRef<number | undefined>(undefined);
  const streamPhaseRef = useRef<RunSummaryStreamPhase>("streaming");
  const sseConnectedRef = useRef(false);

  useEffect(() => {
    streamPhaseRef.current = streamPhase;
  }, [streamPhase]);

  useEffect(() => {
    sseConnectedRef.current = sseConnected;
  }, [sseConnected]);

  useEffect(() => {
    setSummary(initial);
  }, [initial]);

  useEffect(() => {
    if (!options.enabled || runId === null || runId.length === 0) {
      return;
    }

    fallbackStartedRef.current = false;
    let canceled = false;
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/api/proxy/v1/authority/reviews/${encodeURIComponent(runId)}/events`;

    const clearFallback = () => {
      if (fallbackIntervalRef.current !== undefined) {
        window.clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = undefined;
      }
    };

    const tickFallback = async () => {
      if (
        canceled ||
        !shouldRunRunSummaryFallbackPoll({
          sseConnected: sseConnectedRef.current,
          documentHidden: isDocumentHidden(),
          streamPhase: streamPhaseRef.current,
        })
      ) {
        return;
      }

      try {
        const next = await getRunSummary(runId);

        if (canceled) {
          return;
        }

        // A body-less 2xx must not poison consumers with `undefined`; they contract on `null`.
        setSummary(next ?? null);

        if (next?.hasGoldenManifest === true) {
          clearFallback();
          streamPhaseRef.current = "complete";
          setStreamPhase("complete");
        }
      } catch {
        /* keep polling */
      }
    };

    const ensureFallbackInterval = () => {
      if (
        canceled ||
        fallbackIntervalRef.current !== undefined ||
        !shouldRunRunSummaryFallbackPoll({
          sseConnected: sseConnectedRef.current,
          documentHidden: isDocumentHidden(),
          streamPhase: streamPhaseRef.current,
        })
      ) {
        return;
      }

      void tickFallback();
      fallbackIntervalRef.current = window.setInterval(() => {
        void tickFallback();
      }, RUN_SUMMARY_FALLBACK_POLL_MS);
    };

    const startPollingFallback = () => {
      if (canceled || fallbackStartedRef.current) {
        return;
      }

      fallbackStartedRef.current = true;
      sseConnectedRef.current = false;
      streamPhaseRef.current = "poll-fallback";
      setSseConnected(false);
      setStreamPhase("poll-fallback");
      ensureFallbackInterval();
    };

    const onVisibilityChange = () => {
      if (isDocumentHidden()) {
        clearFallback();

        return;
      }

      ensureFallbackInterval();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    let es: EventSource | null = null;

    try {
      es = new EventSource(url);
    } catch {
      startPollingFallback();

      return () => {
        canceled = true;
        document.removeEventListener("visibilitychange", onVisibilityChange);
        clearFallback();
      };
    }

    es.onopen = () => {
      if (!canceled) {
        clearFallback();
        sseConnectedRef.current = true;
        streamPhaseRef.current = "streaming";
        setSseConnected(true);
        setStreamPhase("streaming");
      }
    };

    es.addEventListener("status", (ev: MessageEvent) => {
      if (canceled || typeof ev.data !== "string") {
        return;
      }

      try {
        const parsed = JSON.parse(ev.data) as RunSummary;
        setSummary(parsed);
      } catch {
        /* ignore malformed chunk */
      }
    });

    es.addEventListener("complete", () => {
      if (canceled) {
        return;
      }

      canceled = true;
      clearFallback();
      streamPhaseRef.current = "complete";
      setStreamPhase("complete");
      es?.close();
    });

    es.addEventListener("error", () => {
      if (canceled) {
        return;
      }

      es?.close();
      sseConnectedRef.current = false;
      setSseConnected(false);
      startPollingFallback();
    });

    return () => {
      canceled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearFallback();
      es?.close();
    };
  }, [runId, options.enabled, retryToken]);

  return { summary, streamPhase, sseConnected };
}
