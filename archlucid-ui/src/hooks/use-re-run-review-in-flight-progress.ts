"use client";

import { useEffect, useMemo, useState } from "react";

import { useReviewPipelineInFlightForRun } from "@/hooks/use-review-pipeline-in-flight-for-run";
import {
  buildReRunReviewRunningProgressCopy,
  RE_RUN_REVIEW_PROGRESS_TICK_MS,
  type ReRunReviewRunningProgressCopy,
} from "@/lib/re-run-review-wait-copy";

export type UseReRunReviewInFlightProgressArgs = {
  readonly runId: string;
  readonly attemptNumber: number;
  readonly active: boolean;
  readonly startedAtMs: number;
  /** Override clock for Vitest. */
  readonly nowMs?: () => number;
};

export type UseReRunReviewInFlightProgressResult = {
  readonly progressCopy: ReRunReviewRunningProgressCopy | null;
  readonly elapsedMs: number;
  readonly serverStepLabel: string | null;
};

/**
 * Combines shell operation poll updates with Tier B escalating wait copy for re-run review.
 */
export function useReRunReviewInFlightProgress(
  args: UseReRunReviewInFlightProgressArgs,
): UseReRunReviewInFlightProgressResult {
  const nowFn = args.nowMs ?? Date.now;
  const operation = useReviewPipelineInFlightForRun(args.runId);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!args.active) {
      setElapsedMs(0);

      return;
    }

    function tick(): void {
      setElapsedMs(Math.max(0, nowFn() - args.startedAtMs));
    }

    tick();
    const timer = window.setInterval(tick, RE_RUN_REVIEW_PROGRESS_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [args.active, args.startedAtMs, nowFn]);

  const serverStepLabel = operation?.stepLabel?.trim() ?? null;

  const progressCopy = useMemo(() => {
    if (!args.active) {
      return null;
    }

    return buildReRunReviewRunningProgressCopy({
      attemptNumber: args.attemptNumber,
      stageLabel: serverStepLabel ?? "Queued",
      elapsedMs,
      heartbeatUtc: operation?.heartbeatUtc ?? null,
      operationState: operation?.state ?? null,
      nowMs: nowFn(),
    });
  }, [
    args.active,
    args.attemptNumber,
    elapsedMs,
    nowFn,
    operation?.heartbeatUtc,
    operation?.state,
    serverStepLabel,
  ]);

  return {
    progressCopy,
    elapsedMs,
    serverStepLabel,
  };
}
