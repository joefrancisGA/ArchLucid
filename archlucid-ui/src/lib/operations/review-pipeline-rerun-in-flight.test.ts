import { describe, expect, it } from "vitest";

import type { TrackedInFlightOperation } from "@/lib/operations/in-flight-operations-store";
import { isReviewPipelineReRunInFlight } from "@/lib/operations/review-pipeline-rerun-in-flight";

function row(overrides: Partial<TrackedInFlightOperation> = {}): TrackedInFlightOperation {
  return {
    operationId: "run:1",
    title: "Architecture review analysis",
    href: "/architecture/reviews/1",
    startedAtMs: Date.now(),
    stepLabel: "Queued",
    state: "Pending",
    heartbeatUtc: null,
    runId: "1",
    architectureId: null,
    retainUntilConsumed: false,
    terminalToastShown: false,
    ...overrides,
  };
}

describe("isReviewPipelineReRunInFlight", () => {
  it("returns false when no operation is tracked", () => {
    expect(isReviewPipelineReRunInFlight(null)).toBe(false);
    expect(isReviewPipelineReRunInFlight(undefined)).toBe(false);
  });

  it("returns true for non-terminal pipeline operations", () => {
    expect(isReviewPipelineReRunInFlight(row({ state: "Pending" }))).toBe(true);
    expect(isReviewPipelineReRunInFlight(row({ state: "Running" }))).toBe(true);
  });

  it("returns false once the operation reaches a terminal state", () => {
    expect(isReviewPipelineReRunInFlight(row({ state: "Failed" }))).toBe(false);
    expect(isReviewPipelineReRunInFlight(row({ state: "Succeeded" }))).toBe(false);
    expect(isReviewPipelineReRunInFlight(row({ state: "Canceled" }))).toBe(false);
  });
});
