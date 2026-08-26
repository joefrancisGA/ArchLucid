"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { replayRun } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { INTERNAL_REPLAY_PATH, replayScopedHref } from "@/lib/internal-ops-route-paths";
import { coerceReplayResponse } from "@/lib/operator/operator-response-guards";
import {
  latestValidationOutcomeByRunId,
  loadReplayValidationAuditHistory,
  mapSessionReplayHistoryEntry,
  mergeReplayValidationHistory,
} from "@/lib/replay-validation-history";
import { replayValidationModeDefinition, type ReplayValidationHistoryEntry } from "@/lib/replay-validation-workflow";
import type { ReplayResponse } from "@/types/authority";
import type { RunSummary } from "@/types/authority";

import { defaultReplayMode } from "./replay-page-constants";
import type { ReplayFormViewModel } from "./replay-form-view-model";

export function useReplayForm(): ReplayFormViewModel {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedRunIdFromUrl = (searchParams.get("runId") ?? "").trim();
  const [runId, setRunId] = useState(scopedRunIdFromUrl);
  const [selectedRun, setSelectedRun] = useState<RunSummary | null>(null);
  const [mode, setMode] = useState<string>(defaultReplayMode);
  const [modifyConfirmed, setModifyConfirmed] = useState(false);
  const [result, setResult] = useState<ReplayResponse | null>(null);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [malformedMessage, setMalformedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<ReplayValidationHistoryEntry[]>([]);
  const [auditHistory, setAuditHistory] = useState<ReplayValidationHistoryEntry[]>([]);

  useEffect(() => {
    setRunId(scopedRunIdFromUrl);
  }, [scopedRunIdFromUrl]);

  const onPickReview = useCallback(
    (next: string) => {
      const trimmed = next.trim();

      if (trimmed.length === 0) {
        return;
      }

      router.replace(replayScopedHref(trimmed), { scroll: false });
    },
    [router],
  );

  const handleRunIdChange = useCallback(
    (next: string) => {
      setRunId(next);
      const trimmed = next.trim();

      if (trimmed.length > 0) {
        router.replace(replayScopedHref(trimmed), { scroll: false });
      } else {
        router.replace(INTERNAL_REPLAY_PATH, { scroll: false });
      }
    },
    [router],
  );

  useEffect(() => {
    setModifyConfirmed(false);
  }, [mode, runId]);

  const runIdTrimmed = runId.trim();

  useEffect(() => {
    let canceled = false;

    if (runIdTrimmed.length === 0) {
      setAuditHistory([]);
      return () => {
        canceled = true;
      };
    }

    void loadReplayValidationAuditHistory(runIdTrimmed)
      .then((entries) => {
        if (!canceled) {
          setAuditHistory(entries);
        }
      })
      .catch(() => {
        if (!canceled) {
          setAuditHistory([]);
        }
      });

    return () => {
      canceled = true;
    };
  }, [runIdTrimmed]);

  const historyEntries = useMemo(
    () => mergeReplayValidationHistory(sessionHistory.filter((entry) => entry.runId === runIdTrimmed), auditHistory),
    [auditHistory, runIdTrimmed, sessionHistory],
  );

  const lastValidationByRunId = useMemo(() => latestValidationOutcomeByRunId([...sessionHistory, ...auditHistory]), [auditHistory, sessionHistory]);

  const actionDisabledReason = useMemo(() => {
    if (runIdTrimmed.length === 0) {
      return "Select a finalized package to continue.";
    }

    const definition = replayValidationModeDefinition(mode);

    if (definition.requiresModifyConfirmation && !modifyConfirmed) {
      return "Confirm that you understand stored outputs may be replaced before running this validation.";
    }

    return null;
  }, [modifyConfirmed, mode, runIdTrimmed]);

  const onReplay = useCallback(async () => {
    if (actionDisabledReason !== null) {
      return;
    }

    setLoading(true);
    setFailure(null);
    setMalformedMessage(null);
    setResult(null);
    const startedAt = performance.now();

    try {
      const response: unknown = await replayRun(runIdTrimmed, mode);
      const coerced = coerceReplayResponse(response);

      if (!coerced.ok) {
        setResult(null);
        setMalformedMessage(coerced.message);
        return;
      }

      setResult(coerced.value);
      const durationMs = Math.round(performance.now() - startedAt);
      const sessionEntry = mapSessionReplayHistoryEntry({
        response: coerced.value,
        durationMs,
        initiatedBy: "You",
      });
      setSessionHistory((current) => [sessionEntry, ...current]);
      void loadReplayValidationAuditHistory(runIdTrimmed)
        .then(setAuditHistory)
        .catch(() => undefined);
    } catch (err) {
      setFailure(toApiLoadFailure(err));
      setResult(null);
      const durationMs = Math.round(performance.now() - startedAt);
      const failedEntry = mapSessionReplayHistoryEntry({
        response: {
          runId: runIdTrimmed,
          mode,
          replayedUtc: new Date().toISOString(),
          validation: {
            contextPresent: false,
            graphPresent: false,
            findingsPresent: false,
            manifestPresent: false,
            tracePresent: false,
            artifactsPresent: false,
            manifestHashMatches: false,
            artifactBundlePresentAfterReplay: false,
            notes: [],
          },
        },
        durationMs,
        initiatedBy: "You",
        failure: true,
      });
      setSessionHistory((current) => [failedEntry, ...current]);
    } finally {
      setLoading(false);
    }
  }, [actionDisabledReason, mode, runIdTrimmed]);

  return {
    runId,
    setRunId: handleRunIdChange,
    onPickReview,
    selectedRun,
    setSelectedRun,
    mode,
    setMode,
    modifyConfirmed,
    setModifyConfirmed,
    result,
    failure,
    malformedMessage,
    loading,
    onReplay,
    runIdTrimmed,
    historyEntries,
    lastValidationByRunId,
    actionDisabledReason,
  };
}
