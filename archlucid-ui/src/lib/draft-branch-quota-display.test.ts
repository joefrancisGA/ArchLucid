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
    expect(summary).toContain("Estimated");
    expect(summary).toContain("billable architecture package");
    expect(summary).toContain("full pipeline");
    expect(summary).not.toContain("GPU");
  });

  it("labels missing estimated cost without fabricating zero", () => {
    const summary = formatDraftBranchQuotaSummary({
      draftId: "draft-1",
      existingBranchCount: 0,
      maxBranchesPerParent: 3,
      remainingBranches: 0,
      canBranch: false,
      estimatedBranchRunCostUsd: Number.NaN,
    });

    expect(summary).toContain("Estimated cost not returned");
    expect(summary).toContain("No branches left");
    expect(summary).not.toContain("$0.00");
  });
});
