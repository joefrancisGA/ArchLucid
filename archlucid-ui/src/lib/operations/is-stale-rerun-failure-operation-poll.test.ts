import { describe, expect, it } from "vitest";

import type { TrackedInFlightOperation } from "@/lib/operations/in-flight-operations-store";
import {
  isStaleFailedOperationForAttempt,
  isStaleReRunFailureOperationPoll,
} from "@/lib/operations/is-stale-rerun-failure-operation-poll";

const attemptStartedAtMs = Date.parse("2026-01-01T12:00:00.000Z");

function row(overrides: Partial<TrackedInFlightOperation> = {}): TrackedInFlightOperation {
  return {
    operationId: "run:1",
    title: "Architecture review analysis",
    href: "/architecture/reviews/1",
    startedAtMs: attemptStartedAtMs,
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

describe("isStaleReRunFailureOperationPoll", () => {
  it("treats Failed polls with heartbeat before the attempt as stale", () => {
    expect(
      isStaleReRunFailureOperationPoll(row(), {
        state: "Failed",
        heartbeatUtc: "2026-01-01T11:00:00.000Z",
      }),
    ).toBe(true);
  });

  it("accepts Failed polls whose heartbeat is after the attempt started", () => {
    expect(
      isStaleReRunFailureOperationPoll(row(), {
        state: "Failed",
        heartbeatUtc: "2026-01-01T12:00:10.000Z",
      }),
    ).toBe(false);
  });

  it("ignores non-failed poll projections", () => {
    expect(
      isStaleReRunFailureOperationPoll(row(), {
        state: "Running",
        heartbeatUtc: "2026-01-01T00:00:00.000Z",
      }),
    ).toBe(false);
  });
});

describe("isStaleFailedOperationForAttempt", () => {
  it("blocks terminal outcome when the store row still carries the previous failure heartbeat", () => {
    expect(
      isStaleFailedOperationForAttempt(
        row({
          state: "Failed",
          stepLabel: "Agent execution failed",
          heartbeatUtc: "2026-01-01T00:00:00.000Z",
        }),
        attemptStartedAtMs,
      ),
    ).toBe(true);
  });

  it("allows terminal outcome when the failure heartbeat belongs to this attempt", () => {
    expect(
      isStaleFailedOperationForAttempt(
        row({
          state: "Failed",
          stepLabel: "Agent execution failed",
          heartbeatUtc: "2026-01-01T12:00:10.000Z",
        }),
        attemptStartedAtMs,
      ),
    ).toBe(false);
  });
});
