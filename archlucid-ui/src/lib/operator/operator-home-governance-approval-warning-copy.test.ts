import { describe, expect, it } from "vitest";

import { formatOperatorHomeGovernanceApprovalWarningCount } from "@/lib/operator/operator-home-governance-approval-warning-copy";

describe("formatOperatorHomeGovernanceApprovalWarningCount", () => {
  it("formats singular and plural warning counts", () => {
    expect(formatOperatorHomeGovernanceApprovalWarningCount(1)).toBe("1 approval warning");
    expect(formatOperatorHomeGovernanceApprovalWarningCount(3)).toBe("3 approval warnings");
  });

  it("treats non-finite counts as zero warnings", () => {
    expect(formatOperatorHomeGovernanceApprovalWarningCount(Number.NaN)).toBe("0 approval warnings");
  });
});
