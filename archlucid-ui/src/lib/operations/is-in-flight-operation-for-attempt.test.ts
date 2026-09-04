import { describe, expect, it } from "vitest";

import type { TrackedInFlightOperation } from "@/lib/operations/in-flight-operations-store";
import { isInFlightOperationForAttempt } from "@/lib/operations/is-in-flight-operation-for-attempt";

function row(startedAtMs: number): TrackedInFlightOperation {
  return {
    operationId: "run:1",
    title: "Architecture review analysis",
    href: "/architecture/reviews/1",
    startedAtMs,
    stepLabel: "Queued",
    state: "Pending",
    heartbeatUtc: null,
    runId: "1",
    architectureId: null,
    retainUntilConsumed: false,
    terminalToastShown: false,
  };
}

describe("isInFlightOperationForAttempt", () => {
  it("accepts operations started at or after the current attempt", () => {
    expect(isInFlightOperationForAttempt(row(10_000), 10_000)).toBe(true);
    expect(isInFlightOperationForAttempt(row(10_500), 10_000)).toBe(true);
  });

  it("rejects stale operations from earlier attempts", () => {
    expect(isInFlightOperationForAttempt(row(1_000), 10_000)).toBe(false);
    expect(isInFlightOperationForAttempt(null, 10_000)).toBe(false);
  });
});
