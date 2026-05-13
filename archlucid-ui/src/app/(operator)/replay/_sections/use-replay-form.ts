"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { replayRun } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { coerceReplayResponse } from "@/lib/operator-response-guards";
import type { ReplayResponse } from "@/types/authority";

import { defaultReplayMode } from "./replay-page-constants";
import type { ReplayFormViewModel } from "./replay-form-view-model";

export function useReplayForm(): ReplayFormViewModel {
  const searchParams = useSearchParams();
  const [runId, setRunId] = useState("");
  const [mode, setMode] = useState<string>(defaultReplayMode);
  const [result, setResult] = useState<ReplayResponse | null>(null);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [malformedMessage, setMalformedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const r = searchParams.get("runId");

    if (r) {
      setRunId(r);
    }
  }, [searchParams]);

  const onReplay = useCallback(async () => {
    setLoading(true);
    setFailure(null);
    setMalformedMessage(null);
    setResult(null);

    const trimmedRunId = runId.trim();

    try {
      const response: unknown = await replayRun(trimmedRunId, mode);
      const coerced = coerceReplayResponse(response);

      if (!coerced.ok) {
        setResult(null);
        setMalformedMessage(coerced.message);
      } else {
        setResult(coerced.value);
      }
    } catch (err) {
      setFailure(toApiLoadFailure(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [mode, runId]);

  const runIdTrimmed = runId.trim();

  return {
    runId,
    setRunId,
    mode,
    setMode,
    result,
    failure,
    malformedMessage,
    loading,
    onReplay,
    runIdTrimmed,
  };
}
