import { describe, expect, it } from "vitest";

import {
  buildGovernanceApprovalProvenanceSummaryLines,
  hasGovernanceApprovalProvenance,
} from "@/lib/governance/governance-approval-provenance";

describe("governance-approval-provenance", () => {
  it("requires all provenance fields before the banner may render", () => {
    expect(
      hasGovernanceApprovalProvenance({
        approverLabel: "Jordan Lee",
        approvedAtUtc: "2026-01-14T22:05:00.000Z",
        scopeLabel: "Claims Intake Demo",
        recordId: "approval-claims-intake-001",
      }),
    ).toBe(true);
    expect(
      hasGovernanceApprovalProvenance({
        approverLabel: "",
        approvedAtUtc: "2026-01-14T22:05:00.000Z",
        scopeLabel: "Claims Intake Demo",
        recordId: "approval-claims-intake-001",
      }),
    ).toBe(false);
  });

  it("builds summary lines for approver, timestamp, scope, and record id", () => {
    expect(
      buildGovernanceApprovalProvenanceSummaryLines({
        approverLabel: "Jordan Lee",
        approvedAtUtc: "2026-01-14T22:05:00.000Z",
        scopeLabel: "Claims Intake Demo",
        recordId: "approval-claims-intake-001",
      }),
    ).toEqual([
      "Approver: Jordan Lee",
      expect.stringMatching(/^Approved: /),
      "Scope: Claims Intake Demo",
      "Record: approval-claims-intake-001",
    ]);
  });
});
