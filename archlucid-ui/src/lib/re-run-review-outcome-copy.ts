import { formatOperationElapsed } from "@/lib/operations/format-operation-elapsed";

export const RE_RUN_REVIEW_MIN_BUSY_MS = 400;

export type ReRunReviewOutcomePhase = "running" | "succeeded" | "failed" | "canceled";

export function resolveReRunReviewAttemptNumber(
  serverRetryCount: number | null | undefined,
  sessionAttemptOffset: number,
): number {
  const baseline =
    typeof serverRetryCount === "number" && Number.isFinite(serverRetryCount) && serverRetryCount >= 0
      ? serverRetryCount
      : 0;

  return baseline + sessionAttemptOffset + 1;
}

export function formatReRunReviewStartedHeadline(attemptNumber: number, stepLabel: string): string {
  const label = stepLabel.trim().length > 0 ? stepLabel.trim() : "Queued";

  return `Re-run started — attempt ${attemptNumber} · ${label}`;
}

export function formatReRunReviewTerminalHeadline(options: {
  readonly attemptNumber: number;
  readonly startedAtMs: number;
  readonly finishedAtMs: number;
  readonly terminalState: "Succeeded" | "Failed" | "Canceled";
  readonly stepLabel: string;
}): string {
  const elapsed = formatOperationElapsed(options.startedAtMs, options.finishedAtMs);
  const verb =
    options.terminalState === "Succeeded"
      ? "finished"
      : options.terminalState === "Failed"
        ? "failed"
        : "canceled";
  const label = options.stepLabel.trim();

  if (label.length > 0) {
    return `Attempt ${options.attemptNumber} · ${verb} after ${elapsed} — ${label}`;
  }

  return `Attempt ${options.attemptNumber} · ${verb} after ${elapsed}`;
}

export function reRunReviewOutcomePhaseFromOperationState(
  state: string,
): ReRunReviewOutcomePhase | null {
  switch (state) {
    case "Succeeded":
      return "succeeded";
    case "Failed":
      return "failed";
    case "Canceled":
      return "canceled";
    case "Pending":
    case "Running":
    case "CancelRequested":
      return "running";
    default:
      return null;
  }
}

export type ReRunReviewConfirmBudgetInput = {
  readonly monthlyBudgetMonitoringActive: boolean;
  readonly blocksLlmExecution: boolean;
  readonly remainingBudgetUsd: number | null;
};

export type ReRunReviewConfirmDescription =
  | { readonly kind: "ready"; readonly text: string }
  | { readonly kind: "blocked"; readonly text: string };

function formatReRunReviewConfirmRemainingAllowanceClause(remainingUsd: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(remainingUsd);

  return ` About ${formatted} of this month's AI budget allowance remains.`;
}

/** Single-paragraph copy for the re-run confirmation modal (no duplicate AI-budget lines). */
export function buildReRunReviewConfirmDescription(
  attemptNumber: number,
  budget: ReRunReviewConfirmBudgetInput | null,
): ReRunReviewConfirmDescription {
  const lead = `Attempt ${attemptNumber} will re-invoke architecture analysis on this review.`;

  if (budget === null || budget.monthlyBudgetMonitoringActive !== true) {
    return { kind: "ready", text: lead };
  }

  if (budget.blocksLlmExecution) {
    return {
      kind: "blocked",
      text: `The AI budget for this workspace is exhausted, so attempt ${attemptNumber} cannot re-run this review.`,
    };
  }

  const remainingUsd = budget.remainingBudgetUsd;

  if (typeof remainingUsd === "number" && Number.isFinite(remainingUsd)) {
    return {
      kind: "ready",
      text: `${lead}${formatReRunReviewConfirmRemainingAllowanceClause(remainingUsd)}`,
    };
  }

  return { kind: "ready", text: lead };
}
