import { describe, expect, it } from "vitest";

import { resolvePartialRunCommitBlockPresentation } from "@/lib/runs/run-detail-partial-run-commit-block";

describe("resolvePartialRunCommitBlockedReason (TB-937)", () => {
  it("returns null when finding coverage already owns the block", () => {
    expect(
      resolvePartialRunCommitBlockPresentation({
        legacyRunStatus: "PartiallyCompleted",
        findingCoverageAlreadyBlocking: true,
      }),
    ).toBeNull();
  });

  it("blocks PartiallyCompleted and FailedPartial statuses", () => {
    expect(
      resolvePartialRunCommitBlockPresentation({
        legacyRunStatus: "PartiallyCompleted",
        findingCoverageAlreadyBlocking: false,
      })?.summary,
    ).toContain("incomplete");

    expect(
      resolvePartialRunCommitBlockPresentation({
        legacyRunStatus: "FailedPartial",
        findingCoverageAlreadyBlocking: false,
      })?.summary,
    ).toContain("partially completed");
  });

  it("blocks quality-rejected and Failed with distinct copy (TB-965)", () => {
    const quality = resolvePartialRunCommitBlockPresentation({
      legacyRunStatus: "ExecutionCompletedQualityRejected",
      findingCoverageAlreadyBlocking: false,
    });

    expect(quality?.summary).toContain("Quality gate rejected");
    expect(quality?.summary).toContain("not a platform outage");
    expect(quality?.summary?.toLowerCase()).not.toContain("llm error");

    const failed = resolvePartialRunCommitBlockPresentation({
      legacyRunStatus: "Failed",
      findingCoverageAlreadyBlocking: false,
    });

    expect(failed?.summary).toContain("assessment failed");
  });

  it("uses product-language assessment coverage copy with technical detail behind the summary", () => {
    const presentation = resolvePartialRunCommitBlockPresentation({
      legacyRunStatus: "ReadyForCommit",
      findingCoverageAlreadyBlocking: false,
      agentExecutionOutcomes: [
        { agentType: "Topology", outcome: "Succeeded" },
        { agentType: "Cost", outcome: "Missing" },
        { agentType: "Critic", outcome: "Missing" },
      ],
    });

    expect(presentation?.summary).toContain("Assessment coverage is incomplete");
    expect(presentation?.summary).toContain("quality review");
    expect(presentation?.summary).toContain("cost");
    expect(presentation?.summary).not.toContain("topology");
    expect(presentation?.summary).toContain("Re-run the review");
    expect(presentation?.summary).not.toContain("Critic");
    expect(presentation?.summary).not.toContain("Missing");
    expect(presentation?.summary?.toLowerCase()).not.toContain("re-execute");
    expect(presentation?.technicalDetail).toContain("Cost (Missing)");
    expect(presentation?.technicalDetail).toContain("Critic (Missing)");
  });

  it("uses architecture structure instead of topology for Topology agent gaps", () => {
    const presentation = resolvePartialRunCommitBlockPresentation({
      legacyRunStatus: "ReadyForCommit",
      findingCoverageAlreadyBlocking: false,
      agentExecutionOutcomes: [{ agentType: "Topology", outcome: "Missing" }],
    });

    expect(presentation?.summary).toContain("architecture structure");
    expect(presentation?.summary?.toLowerCase()).not.toContain("topology");
    expect(presentation?.technicalDetail).toContain("Topology (Missing)");
  });

  it("returns stale critic copy when Critic outcome is Stale (TB-942)", () => {
    const presentation = resolvePartialRunCommitBlockPresentation({
      legacyRunStatus: "ReadyForCommit",
      findingCoverageAlreadyBlocking: false,
      agentExecutionOutcomes: [
        { agentType: "Topology", outcome: "Succeeded" },
        { agentType: "Cost", outcome: "Succeeded" },
        { agentType: "Compliance", outcome: "Succeeded" },
        { agentType: "Critic", outcome: "Stale" },
      ],
    });

    expect(presentation?.summary).toBe("Critic out of date — re-run required.");
    expect(presentation?.technicalDetail).toContain("Critic (Stale)");
  });
});
