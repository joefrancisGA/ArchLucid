import { describe, expect, it } from "vitest";

import {
  formatReviewFailureRecordedAtLabel,
  formatReviewLastFailureCauseLine,
  resolveReviewFailureRecordedAtUtc,
} from "@/components/resolve-run-detail-last-failure-summary";

describe("resolve-run-detail-last-failure-summary helpers", () => {
  it("formats recorded failure cause with agent, class, and reason code", () => {
    const line = formatReviewLastFailureCauseLine({
      agentType: "HolisticCritic",
      failureClass: "parse",
      reasonCode: "SchemaViolation",
    });

    expect(line).toContain("Agent (HolisticCritic)");
    expect(line).toContain("Parse / schema failure");
    expect(line).toContain("reason code SchemaViolation");
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

  it("formats failure recorded time for display", () => {
    expect(formatReviewFailureRecordedAtLabel("2026-09-01T12:00:00.000Z")).not.toBeNull();
  });
});
