/**
 * Tier B staged-wait copy helpers (TB-2078) — named stages, no fake percentages.
 * Escalation thresholds: quiet → 10s tip → 30s tip → timeout recovery framing.
 */

export const LONG_OPERATION_ESCALATION_10S_MS = 10_000;
export const LONG_OPERATION_ESCALATION_30S_MS = 30_000;
/** Soft ceiling aligned with UI proxy JSON timeout (~60s) — recovery copy, not a hard abort. */
export const LONG_OPERATION_TIMEOUT_HINT_MS = 60_000;

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
      detail: `${args.operationLabel} is still in progress. Named stages only — no percent complete.`,
    };
  }

  return {
    level,
    headline,
    detail: `${args.operationLabel} started…`,
  };
}
