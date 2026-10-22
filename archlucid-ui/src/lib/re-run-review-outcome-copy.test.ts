import { describe, expect, it } from "vitest";

import {
  buildReRunReviewConfirmDescription,
  formatReRunReviewStartedHeadline,
  formatReRunReviewTerminalHeadline,
  resolveReRunReviewAttemptNumber,
  reRunReviewOutcomePhaseFromOperationState,
} from "@/lib/re-run-review-outcome-copy";

describe("re-run-review-outcome-copy", () => {
  it("resolves attempt number from server retry count and session offset", () => {
    expect(resolveReRunReviewAttemptNumber(2, 0)).toBe(3);
    expect(resolveReRunReviewAttemptNumber(null, 1)).toBe(2);
    expect(resolveReRunReviewAttemptNumber(-1, 0)).toBe(1);
  });

  it("formats started and terminal headlines", () => {
    expect(formatReRunReviewStartedHeadline(3, "Queued")).toBe("Re-run started — attempt 3 · Queued");
    expect(
      formatReRunReviewTerminalHeadline({
        attemptNumber: 3,
        startedAtMs: 0,
        finishedAtMs: 1_200,
        terminalState: "Failed",
        stepLabel: "Agent execution failed",
      }),
    ).toBe("Attempt 3 · failed after 1s — Agent execution failed");
  });

  it("maps operation states to outcome phases", () => {
    expect(reRunReviewOutcomePhaseFromOperationState("Running")).toBe("running");
    expect(reRunReviewOutcomePhaseFromOperationState("Failed")).toBe("failed");
    expect(reRunReviewOutcomePhaseFromOperationState("unknown")).toBeNull();
  });

  it("builds a single confirm paragraph without repeating AI budget consumption", () => {
    expect(buildReRunReviewConfirmDescription(3, null)).toEqual({
      kind: "ready",
      text: "Attempt 3 will re-invoke architecture analysis on this review.",
    });
    expect(
      buildReRunReviewConfirmDescription(3, {
        monthlyBudgetMonitoringActive: true,
        blocksLlmExecution: false,
        remainingBudgetUsd: 12.5,
      }),
    ).toEqual({
      kind: "ready",
      text:
        "Attempt 3 will re-invoke architecture analysis on this review. About $12.50 of this month's AI budget allowance remains.",
    });
    expect(
      buildReRunReviewConfirmDescription(3, {
        monthlyBudgetMonitoringActive: true,
        blocksLlmExecution: true,
        remainingBudgetUsd: 0,
      }),
    ).toEqual({
      kind: "blocked",
      text: "The AI budget for this workspace is exhausted, so attempt 3 cannot re-run this review.",
    });
  });
});
