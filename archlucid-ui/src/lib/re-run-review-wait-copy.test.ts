import { describe, expect, it } from "vitest";

import {
  buildReRunReviewRunningProgressCopy,
  formatHeartbeatAgeLine,
  isReRunReviewStageLikelyStalled,
  resolveHeartbeatAgeMs,
} from "@/lib/re-run-review-wait-copy";

describe("re-run-review-wait-copy", () => {
  it("formats heartbeat age for operator-facing detail", () => {
    expect(formatHeartbeatAgeLine(2_000)).toBe("Server signaled just now.");
    expect(formatHeartbeatAgeLine(42_000)).toBe("Server last signaled 42s ago.");
    expect(formatHeartbeatAgeLine(null)).toBeNull();
  });

  it("resolves heartbeat age from utc", () => {
    const nowMs = Date.parse("2026-01-01T00:01:00.000Z");

    expect(resolveHeartbeatAgeMs("2026-01-01T00:00:30.000Z", nowMs)).toBe(30_000);
  });

  it("escalates when queued stage stays stale past 60s", () => {
    expect(
      isReRunReviewStageLikelyStalled({
        elapsedMs: 61_000,
        stageLabel: "Queued",
        heartbeatAgeMs: 50_000,
        operationState: "Pending",
      }),
    ).toBe(true);

    expect(
      isReRunReviewStageLikelyStalled({
        elapsedMs: 61_000,
        stageLabel: "Compliance agent running",
        heartbeatAgeMs: 5_000,
        operationState: "Running",
      }),
    ).toBe(false);
  });

  it("builds running progress copy with attempt headline and escalating detail", () => {
    const copy = buildReRunReviewRunningProgressCopy({
      attemptNumber: 3,
      stageLabel: "Running agents",
      elapsedMs: 12_000,
      heartbeatUtc: "2026-01-01T00:00:10.000Z",
      operationState: "Running",
      nowMs: Date.parse("2026-01-01T00:01:00.000Z"),
    });

    expect(copy.headline).toBe("Re-run started — attempt 3 · Running agents");
    expect(copy.detail).toContain("Re-running architecture review is still in progress");
    expect(copy.detail).toContain("Server last signaled 50s ago");
    expect(copy.level).toBe("after10s");
    expect(copy.stalled).toBe(false);
  });
});
