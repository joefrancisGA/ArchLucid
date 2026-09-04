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
  "Return to Overview if you want to keep working — this review's status stays on your home page.";

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

export function formatLongOperationQueueStatusLine(stageLabel: string): string {
  const label = stageLabel.trim().length > 0 ? stageLabel.trim() : "Queued";

  return `Queue status: ${label}`;
}
