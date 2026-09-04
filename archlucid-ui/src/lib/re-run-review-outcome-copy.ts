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
