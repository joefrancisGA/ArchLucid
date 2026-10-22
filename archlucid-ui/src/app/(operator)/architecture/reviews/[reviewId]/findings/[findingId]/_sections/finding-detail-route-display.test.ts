import { describe, expect, it } from "vitest";

import type { FindingInspectPayload } from "@/types/finding-inspect";

import { resolveBuyerShowcaseResidualRiskNextReviewIso } from "@/lib/buyer/buyer-polish-copy";

import {
  buyerFindingDecisionImpactCopy,
  buyerFindingNextStepCopy,
  deriveFindingDecisionSummary,
  findingRecommendedActionParagraph,
  fallbackImpactedScope,
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
    expect(buyerFindingNextStepCopy(null, "sensitive-data-minimization-risk")).toContain("ingress PHI classification");
  });

  it("does not invent owner, status, or monitoring for PHI showcase finding id without payload (P-13–P-14, P-20)", () => {
    const summary = deriveFindingDecisionSummary(null, "sensitive-data-minimization-risk");

    expect(summary.disposition).toBe("Status was not stored");
    expect(summary.riskOwner).toBe("Risk owner was not stored");
    expect(summary.requiredMonitoring).toBe("No recommended action recorded for this finding.");
    expect(summary.nextReview).toBe(resolveBuyerShowcaseResidualRiskNextReviewIso(new Date("2026-08-22T12:00:00Z")));
  });

  it("uses showcase next review when persisted remediation due is in the past", () => {
    const payload = emptyPayload({
      remediationDueUtc: "2024-02-14T00:00:00Z",
    });

    expect(resolveFindingNextReviewLabel(payload, "sensitive-data-minimization-risk")).toBe(
      resolveBuyerShowcaseResidualRiskNextReviewIso(new Date("2026-08-22T12:00:00Z")),
    );
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
    expect(resolveFindingRiskOwnerLabel(emptyPayload(), "generic-finding")).toBe("Risk owner was not stored");
    expect(resolveFindingNextReviewLabel(emptyPayload(), "generic-finding")).toBe(
      "Remediation due date was not stored.",
    );
  });

  it("distinguishes missing and stored empty remediation due dates", () => {
    expect(resolveFindingNextReviewLabel(emptyPayload({ remediationDueUtc: null }), "generic-finding")).toBe(
      "Remediation due date was not stored.",
    );
    expect(resolveFindingNextReviewLabel(emptyPayload({ remediationDueUtc: "" }), "generic-finding")).toBe(
      "Remediation due date was stored empty.",
    );
    expect(resolveFindingNextReviewLabel(emptyPayload({ remediationDueUtc: " " }), "generic-finding")).toBe(
      "Remediation due date was stored empty.",
    );
    expect(formatFindingRemediationDueLabel("")).toBe("Remediation due date was stored empty.");
  });

  it("does not invent an impacted area for an ordinary finding", () => {
    expect(fallbackImpactedScope(emptyPayload(), "generic-finding")).toBe(
      "Impacted area was not stored.",
    );
  });
});
