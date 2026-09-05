/**
 * Tier B staged-wait copy helpers (TB-2078) — named stages, no fake percentages.
 * Escalation thresholds: quiet → 10s tip → 30s tip → timeout recovery framing.
 */

export const LONG_OPERATION_ESCALATION_10S_MS = 10_000;
export const LONG_OPERATION_ESCALATION_30S_MS = 30_000;
/** Soft ceiling aligned with UI proxy JSON timeout (~60s) — recovery copy, not a hard abort. */
export const LONG_OPERATION_TIMEOUT_HINT_MS = 60_000;

/** Operator-facing cadence for queue status on long-running review work. */
export const LONG_OPERATION_QUEUE_STATUS_REFRESH_HINT =
  "Queue status refreshes every 10 seconds.";

/** Lets operators leave the review detail page without losing visibility into pipeline state. */
export const LONG_OPERATION_HOME_PAGE_STATUS_HINT =
  "Return to Home if you want to keep working — this review's status stays on your home page.";

export type LongOperationEscalationLevel = "quiet" | "after10s" | "after30s" | "timeoutHint";

export type LongOperationWaitCopy = {
  readonly headline: string;
  readonly detail: string;
  readonly level: LongOperationEscalationLevel;
};

export function resolveLongOperationEscalationLevel(elapsedMs: number): LongOperationEscalationLevel {
  if (elapsedMs >= LONG_OPERATION_TIMEOUT_HINT_MS) {
    return "timeoutHint";
  }

  if (elapsedMs >= LONG_OPERATION_ESCALATION_30S_MS) {
    return "after30s";
  }

  if (elapsedMs >= LONG_OPERATION_ESCALATION_10S_MS) {
    return "after10s";
  }

  return "quiet";
}

export function buildLongOperationWaitCopy(args: {
  readonly operationLabel: string;
  readonly stageLabel: string;
  readonly elapsedMs: number;
}): LongOperationWaitCopy {
  const level = resolveLongOperationEscalationLevel(args.elapsedMs);
  const headline = args.stageLabel.trim().length > 0 ? args.stageLabel.trim() : args.operationLabel;

  if (level === "timeoutHint") {
    return {
      level,
      headline,
      detail:
        "This is taking longer than usual. You can wait a bit more, retry, or leave this page — work already accepted on the server is not canceled by navigating away.",
    };
  }

  if (level === "after30s") {
    return {
      level,
      headline,
      detail: `${args.operationLabel} is still running. Large reviews and exports often take 30–60 seconds — hang tight.`,
    };
  }

  if (level === "after10s") {
    return {
      level,
      headline,
      detail: `${args.operationLabel} is still in progress.`,
    };
  }

  return {
    level,
    headline,
    detail: `${args.operationLabel} started…`,
  };
}

/** Sentence-case label for queue status rows in long-operation wait surfaces. */
export const LONG_OPERATION_QUEUE_STATUS_LABEL = "Queue status:";

/** Elapsed suffix after the first 10s queue-status refresh (e.g. " (14s)"). */
export function formatQueueStatusElapsedSuffix(elapsedMs: number): string | null {
  if (elapsedMs < LONG_OPERATION_ESCALATION_10S_MS) {
    return null;
  }

  const sec = Math.floor(elapsedMs / 1000);

  if (sec < 60) {
    return ` (${sec}s)`;
  }

  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;

  if (seconds === 0) {
    return ` (${minutes}m)`;
  }

  return ` (${minutes}m ${seconds}s)`;
}

export function resolveLongOperationQueueStatusValue(
  stageLabel: string,
  elapsedMs?: number,
): string {
  const label = stageLabel.trim().length > 0 ? stageLabel.trim() : "Queued";
  const elapsedSuffix =
    elapsedMs !== undefined ? formatQueueStatusElapsedSuffix(elapsedMs) : null;

  if (elapsedSuffix !== null) {
    return `${label}${elapsedSuffix}`;
  }

  return label;
}

export function formatLongOperationQueueStatusLine(stageLabel: string, elapsedMs?: number): string {
  return `${LONG_OPERATION_QUEUE_STATUS_LABEL} ${resolveLongOperationQueueStatusValue(stageLabel, elapsedMs)}`;
}
