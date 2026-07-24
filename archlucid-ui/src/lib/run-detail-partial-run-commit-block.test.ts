import { describe, expect, it } from "vitest";

import { resolvePartialRunCommitBlockedReason } from "@/lib/run-detail-partial-run-commit-block";

describe("resolvePartialRunCommitBlockedReason (TB-937)", () => {
  it("returns null when finding coverage already owns the block", () => {
    expect(
      resolvePartialRunCommitBlockedReason({
        legacyRunStatus: "PartiallyCompleted",
        findingCoverageAlreadyBlocking: true,
      }),
    ).toBeNull();
  });

  it("blocks PartiallyCompleted and FailedPartial statuses", () => {
    expect(
      resolvePartialRunCommitBlockedReason({
        legacyRunStatus: "PartiallyCompleted",
        findingCoverageAlreadyBlocking: false,
      }),
    ).toContain("incomplete");

    expect(
      resolvePartialRunCommitBlockedReason({
        legacyRunStatus: "FailedPartial",
        findingCoverageAlreadyBlocking: false,
      }),
    ).toContain("partially failed");
  });

  it("blocks when outcome matrix has non-Succeeded required agents", () => {
    const reason = resolvePartialRunCommitBlockedReason({
      legacyRunStatus: "ReadyForCommit",
      findingCoverageAlreadyBlocking: false,
      agentExecutionOutcomes: [
        { agentType: "Topology", outcome: "Succeeded" },
        { agentType: "Cost", outcome: "Missing" },
      ],
    });

    expect(reason).toContain("Cost");
    expect(reason).toContain("Missing");
  });
});
