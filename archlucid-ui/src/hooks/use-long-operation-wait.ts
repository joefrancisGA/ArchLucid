"use client";

import { useEffect, useState } from "react";

import {
  buildLongOperationWaitCopy,
  type LongOperationEscalationLevel,
  type LongOperationWaitCopy,
} from "@/lib/operations/long-operation-wait-copy";

export type UseLongOperationWaitArgs = {
  readonly active: boolean;
  readonly operationLabel: string;
  readonly stageLabel?: string;
  /** Override clock for Vitest. */
  readonly nowMs?: () => number;
};

export type UseLongOperationWaitResult = {
  readonly active: boolean;
  readonly elapsedMs: number;
  readonly level: LongOperationEscalationLevel;
  readonly copy: LongOperationWaitCopy;
};

/**
 * Tracks wall-clock elapsed time while a Tier B sync operation is in flight (TB-2078).
 */
export function useLongOperationWait(args: UseLongOperationWaitArgs): UseLongOperationWaitResult {
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

    const timer = window.setInterval(() => {
      setElapsedMs(Math.max(0, nowFn() - started));
    }, 500);

    return () => {
      window.clearInterval(timer);
    };
  }, [args.active, args.nowMs, nowFn]);

  const effectiveElapsed =
    args.active && startedAtMs !== null ? Math.max(elapsedMs, nowFn() - startedAtMs) : 0;
  const copy = buildLongOperationWaitCopy({
    operationLabel: args.operationLabel,
    stageLabel: args.stageLabel ?? args.operationLabel,
    elapsedMs: effectiveElapsed,
  });

  return {
    active: args.active,
    elapsedMs: effectiveElapsed,
    level: copy.level,
    copy,
  };
}
