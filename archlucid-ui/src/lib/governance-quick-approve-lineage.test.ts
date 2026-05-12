import { describe, expect, it } from "vitest";

import { approvalLineageBlocksQuickApprove } from "@/lib/governance-quick-approve-lineage";

describe("approvalLineageBlocksQuickApprove", () => {
  it("returns false for empty or non-blocking severities", () => {
    expect(approvalLineageBlocksQuickApprove([])).toBe(false);
    expect(approvalLineageBlocksQuickApprove([{ severity: "Info" }])).toBe(false);
    expect(approvalLineageBlocksQuickApprove([{ severity: "Warning" }])).toBe(false);
  });

  it("blocks on Critical, Error, and High (case-insensitive)", () => {
    expect(approvalLineageBlocksQuickApprove([{ severity: "Critical" }])).toBe(true);
    expect(approvalLineageBlocksQuickApprove([{ severity: "critical" }])).toBe(true);
    expect(approvalLineageBlocksQuickApprove([{ severity: "Error" }])).toBe(true);
    expect(approvalLineageBlocksQuickApprove([{ severity: "High" }])).toBe(true);
  });

  it("blocks when any row in the snapshot is high-severity", () => {
    expect(
      approvalLineageBlocksQuickApprove([{ severity: "Warning" }, { severity: "Critical" }, { severity: "Info" }]),
    ).toBe(true);
  });
});
