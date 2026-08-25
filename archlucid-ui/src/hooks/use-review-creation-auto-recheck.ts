"use client";

import { useEffect, useRef } from "react";

import type { ReviewCreationOutcome } from "@/hooks/use-review-creation-progress";

const AUTO_RECHECK_DELAYS_MS = [2_000, 5_000, 10_000, 20_000] as const;

export type UseReviewCreationAutoRecheckArgs = {
  readonly outcome: ReviewCreationOutcome | null;
  readonly isActive: boolean;
  readonly onRecheck: () => void;
};

/**
 * Replays the idempotent create on backoff while the client is in the unresolved state.
 * Manual recheck remains available after auto attempts are exhausted.
 */
export function useReviewCreationAutoRecheck(args: UseReviewCreationAutoRecheckArgs): {
  readonly autoRecheckExhausted: boolean;
} {
  const { outcome, isActive, onRecheck } = args;
  const attemptRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const onRecheckRef = useRef(onRecheck);

  onRecheckRef.current = onRecheck;

  useEffect(() => {
    if (outcome?.kind !== "unresolved") {
      attemptRef.current = 0;

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      return;
    }

    if (isActive) {
      return;
    }

    if (attemptRef.current >= AUTO_RECHECK_DELAYS_MS.length) {
      return;
    }

    const delayMs = AUTO_RECHECK_DELAYS_MS[attemptRef.current];
    attemptRef.current += 1;

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      onRecheckRef.current();
    }, delayMs);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, outcome]);

  return {
    autoRecheckExhausted:
      outcome?.kind === "unresolved" &&
      !isActive &&
      attemptRef.current >= AUTO_RECHECK_DELAYS_MS.length,
  };
}
