/** Milliseconds after which an in-progress review is considered stalled for operator guidance. */
export const STALLED_REVIEW_THRESHOLD_MS = 15 * 60 * 1000;

export type StalledReviewSignal = {
  readonly isStalled: boolean;
  readonly elapsedMinutes: number;
};

/**
 * Detects reviews that have been in a non-terminal state longer than the threshold.
 * `startedAtIso` is the review request timestamp from the API when available.
 */
export function detectStalledReview(
  startedAtIso: string | null | undefined,
  isTerminal: boolean,
  nowMs: number = Date.now(),
  isDeadLettered: boolean = false,
): StalledReviewSignal {
  if (isDeadLettered || isTerminal) {
    return { isStalled: false, elapsedMinutes: 0 };
  }

  const startedMs = startedAtIso !== null && startedAtIso !== undefined ? new Date(startedAtIso).getTime() : Number.NaN;

  if (Number.isNaN(startedMs)) {
    return { isStalled: false, elapsedMinutes: 0 };
  }

  const elapsedMs = Math.max(0, nowMs - startedMs);
  const elapsedMinutes = Math.floor(elapsedMs / 60_000);

  return {
    isStalled: elapsedMs >= STALLED_REVIEW_THRESHOLD_MS,
    elapsedMinutes,
  };
}
