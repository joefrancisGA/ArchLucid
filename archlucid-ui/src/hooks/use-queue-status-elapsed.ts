"use client";

import { useEffect, useState } from "react";

import { RE_RUN_REVIEW_PROGRESS_TICK_MS } from "@/lib/re-run-review-wait-copy";

export type UseQueueStatusElapsedArgs = {
  readonly active: boolean;
  /** Resets the elapsed clock when the stage label changes. */
  readonly stageLabel: string;
  /** Override clock for Vitest. */
  readonly nowMs?: () => number;
};

/**
 * Tracks wall-clock elapsed time for queue status rows, aligned to the 10s refresh cadence.
 */
export function useQueueStatusElapsed(args: UseQueueStatusElapsedArgs): number {
  const nowFn = args.nowMs ?? Date.now;
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!args.active) {
      setStartedAtMs(null);
      setElapsedMs(0);

      return;
    }

    const started = nowFn();
    setStartedAtMs(started);
    setElapsedMs(0);

    function tick(): void {
      setElapsedMs(Math.max(0, nowFn() - started));
    }

    tick();
    const timer = window.setInterval(tick, RE_RUN_REVIEW_PROGRESS_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [args.active, args.stageLabel, args.nowMs]);

  if (!args.active || startedAtMs === null) {
    return 0;
  }

  return Math.max(elapsedMs, nowFn() - startedAtMs);
}
