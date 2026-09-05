import { describe, expect, it } from "vitest";

import {
  formatReviewFailureRecordedAtLabel,
  formatReviewLastFailureCauseLine,
  resolveReviewFailureRecordedAtUtc,
} from "@/components/resolve-run-detail-last-failure-summary";

describe("resolve-run-detail-last-failure-summary helpers", () => {
  it("formats recorded failure cause as a plain-language sentence", () => {
    const line = formatReviewLastFailureCauseLine({
      agentType: "HolisticCritic",
      failureClass: "parse",
      reasonCode: "SchemaViolation",
    });

    expect(line).toContain("parsed");
    expect(line).not.toContain("Unknown agent");
    expect(line).not.toContain("Invalid operation");
  });

  it("resolves failure recorded time from pipeline summary", () => {
    expect(
      resolveReviewFailureRecordedAtUtc({
        pipelineSummary: { completedUtc: "2026-09-01T12:00:00.000Z" } as never,
      }),
    ).toBe("2026-09-01T12:00:00.000Z");
  });

  it("prefers run completedUtc when pipeline summary omits completedUtc", () => {
    expect(
      resolveReviewFailureRecordedAtUtc({
        pipelineSummary: { completedUtc: null } as never,
        runCompletedUtc: "2026-09-02T08:30:00.000Z",
      }),
    ).toBe("2026-09-02T08:30:00.000Z");
  });

  it("formats failure recorded time for display with UTC suffix", () => {
    expect(formatReviewFailureRecordedAtLabel("2026-09-01T12:00:00.000Z")).toContain("UTC");
  });
});
