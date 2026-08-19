import { describe, expect, it } from "vitest";

import { formatDraftBranchQuotaSummary } from "./draft-branch-quota-display";

describe("formatDraftBranchQuotaSummary", () => {
  it("includes branch usage and estimated cost", () => {
    const summary = formatDraftBranchQuotaSummary({
      draftId: "draft-1",
      existingBranchCount: 1,
      maxBranchesPerParent: 3,
      remainingBranches: 2,
      canBranch: true,
      estimatedBranchRunCostUsd: 1,
    });

    expect(summary).toContain("1/3");
    expect(summary).toContain("2 remaining");
    expect(summary).toContain("$1.00");
    expect(summary).toContain("estimated from AI budget");
    expect(summary).not.toContain("GPU");
  });
});
