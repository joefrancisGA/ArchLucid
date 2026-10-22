import { describe, expect, it } from "vitest";

import { resolveGovernanceQueueRiskExceptionAction } from "@/components/governance/findings/governance-findings-queue-operational-actions";
import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

const baseFindingRow: GovernanceFindingQueueRow = {
  runId: "run-1",
  runLabel: "Claims Intake Review",
  manifestId: "manifest-1",
  findingId: "finding-1",
  title: "PHI minimization risk",
  severity: "High",
  category: "Privacy",
  status: "Accepted",
  recordKind: "finding",
  recommended: "Minimize PHI in transit",
  policyRuleId: null,
  ownerUserId: "owner@contoso.com",
  waiverExpiresAtUtc: null,
  lastReviewedUtc: null,
  agingDays: 3,
  isStale: false,
};

describe("resolveGovernanceQueueRiskExceptionAction", () => {
  it("routes create-exception to finding inspect when no waiver exists", () => {
    const action = resolveGovernanceQueueRiskExceptionAction(baseFindingRow);

    expect(action.label).toBe("Create exception");
    expect(action.href).toBe("/architecture/reviews/run-1/findings/finding-1/evidence-trace");
  });

  it("routes view-exception to the risk-exception register when a waiver expiry is present", () => {
    const action = resolveGovernanceQueueRiskExceptionAction({
      ...baseFindingRow,
      waiverExpiresAtUtc: "2026-12-01T00:00:00Z",
    });

    expect(action.label).toBe("View exception");
    expect(action.href).toBe("/governance/exceptions");
  });
});
