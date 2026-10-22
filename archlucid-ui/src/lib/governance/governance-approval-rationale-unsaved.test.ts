import { describe, expect, it } from "vitest";

import { governanceApprovalRationaleHasUnsavedEdits } from "@/lib/governance/governance-approval-rationale-unsaved";

describe("governance-approval-rationale-unsaved (LW-072)", () => {
  it("treats a non-empty trimmed review comment as dirty", () => {
    expect(governanceApprovalRationaleHasUnsavedEdits("")).toBe(false);
    expect(governanceApprovalRationaleHasUnsavedEdits("   ")).toBe(false);
    expect(governanceApprovalRationaleHasUnsavedEdits("Approved with monitoring.")).toBe(true);
  });
});
