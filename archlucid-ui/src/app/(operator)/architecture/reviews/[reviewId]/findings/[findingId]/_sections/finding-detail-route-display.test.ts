import { describe, expect, it } from "vitest";

import type { FindingInspectPayload } from "@/types/finding-inspect";

import {
  buyerFindingDecisionImpactCopy,
  buyerFindingNextStepCopy,
  deriveFindingDecisionSummary,
  findingRecommendedActionParagraph,
  formatFindingRemediationDueLabel,
  mitigationPosture,
  resolveFindingNextReviewLabel,
  resolveFindingRiskOwnerLabel,
} from "./finding-detail-route-display";

function emptyPayload(overrides: Partial<FindingInspectPayload> = {}): FindingInspectPayload {
  return {
    findingId: "generic-finding",
    typedPayload: null,
    decisionRuleId: null,
    decisionRuleName: null,
    evidence: [],
    recommendedActions: [],
    auditRowId: null,
    runId: "run-1",
    manifestVersion: null,
    ...overrides,
  };
}

describe("finding-detail-route-display buyer summary copy", () => {
  it("returns decision impact and next step for the PHI showcase finding", () => {
    expect(buyerFindingDecisionImpactCopy(null, "sensitive-data-minimization-risk")).toContain("Non-blocking for package approval");
    expect(buyerFindingNextStepCopy(null, "sensitive-data-minimization-risk")).toContain("ingress classification");
  });

  it("derives compact decision summary for PHI showcase finding id", () => {
    const summary = deriveFindingDecisionSummary(null, "sensitive-data-minimization-risk");

    expect(summary.severity).toBeTruthy();
    expect(summary.disposition).toContain("monitoring");
    expect(summary.businessImpact).toContain("Non-blocking");
    expect(summary.requiredMonitoring.length).toBeGreaterThan(0);
    expect(summary.nextReview.length).toBeGreaterThan(0);
    expect(summary.riskOwner.length).toBeGreaterThan(0);
  });

  it("does not invent PHI monitoring for non-PHI findings", () => {
    expect(mitigationPosture(null, "some-other-finding")).toBe(
      "No recommended action recorded for this finding.",
    );
    expect(findingRecommendedActionParagraph(emptyPayload(), "some-other-finding")).toBe(
      "No recommended action recorded for this finding.",
    );
  });

  it("uses payload assignee and remediation due when present", () => {
    const payload = emptyPayload({
      assignedToUserId: "privacy.office@example.com",
      remediationDueUtc: "2026-09-15T00:00:00Z",
    });

    expect(resolveFindingRiskOwnerLabel(payload, "generic-finding")).toBe("privacy.office@example.com");
    expect(resolveFindingNextReviewLabel(payload, "generic-finding")).toBe(
      formatFindingRemediationDueLabel("2026-09-15T00:00:00Z"),
    );
  });

  it("fails closed on owner and next review when payload has neither", () => {
    expect(resolveFindingRiskOwnerLabel(emptyPayload(), "generic-finding")).toBe("Not assigned");
    expect(resolveFindingNextReviewLabel(emptyPayload(), "generic-finding")).toBe(
      "No remediation due date recorded",
    );
  });
});
