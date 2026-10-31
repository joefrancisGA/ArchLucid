import { describe, expect, it } from "vitest";

import type { FindingInspectPayload } from "@/types/finding-inspect";

import {
  buyerFindingDecisionImpactCopy,
  buyerFindingNextStepCopy,
  deriveFindingDecisionSummary,
  findingDetailLeadFallback,
  findingRecommendedActionParagraph,
  fallbackImpactedScope,
  formatFindingRemediationDueLabel,
  mitigationPosture,
  resolveFindingNextReviewLabel,
  resolveFindingRiskOwnerLabel,
  summarizeEvidenceBasis,
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
  it("does not name Claims Intake before inspect payload loads (P-20)", () => {
    expect(findingDetailLeadFallback("sensitive-data-minimization-risk")).toBe("Finding detail has not loaded.");
    expect(findingDetailLeadFallback("sensitive-data-minimization-risk")).not.toContain("Claims Intake");
  });

  it("does not invent business impact for PHI showcase finding id without payload", () => {
    expect(buyerFindingDecisionImpactCopy(null, "sensitive-data-minimization-risk")).toBe(
      "Business impact was not stored",
    );
  });

  it("does not invent High severity for PHI showcase finding id without payload", () => {
    const summary = deriveFindingDecisionSummary(null, "sensitive-data-minimization-risk");

    expect(summary.severity).toBe("Severity was not stored");
  });

  it("does not invent owner, status, or monitoring for PHI showcase finding id without payload", () => {
    const summary = deriveFindingDecisionSummary(null, "sensitive-data-minimization-risk");

    expect(summary.disposition).toBe("Status was not stored");
    expect(summary.riskOwner).toBe("Risk owner was not stored");
    expect(summary.requiredMonitoring).toBe("Recommended action was not stored.");
    expect(summary.nextReview).toBe("Remediation due date was not stored.");
  });

  it("keeps a past stored remediation due date on the finding", () => {
    const payload = emptyPayload({
      remediationDueUtc: "2024-02-14T00:00:00Z",
    });

    expect(resolveFindingNextReviewLabel(payload, "sensitive-data-minimization-risk")).toBe(
      formatFindingRemediationDueLabel("2024-02-14T00:00:00Z"),
    );
  });

  it("does not invent PHI monitoring for non-PHI findings", () => {
    expect(mitigationPosture(null, "some-other-finding")).toBe("Recommended action was not stored.");
    expect(findingRecommendedActionParagraph(emptyPayload(), "some-other-finding")).toBe(
      "Recommended action was not stored.",
    );
  });

  it("uses payload assignee and remediation due when present", () => {
    const payload = emptyPayload({
      assignedToUserId: "privacy.office@example.com",
      remediationDueUtc: "2026-09-15T00:00:00Z",
    });

    expect(resolveFindingRiskOwnerLabel(payload, "generic-finding")).toBe(
      "Risk owner name was not stored. Assignee id privacy.office@example.com.",
    );
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

  it("summarizeEvidenceBasis distinguishes omitted evidence list from empty stored list", () => {
    expect(summarizeEvidenceBasis(emptyPayload())).toBe("Evidence list was not stored.");
    expect(summarizeEvidenceBasis(emptyPayload({ evidenceListReturned: true }))).toBe(
      "0 evidence citations were stored.",
    );
  });

  it("summarizeEvidenceBasis names rule id when rule name is absent", () => {
    expect(
      summarizeEvidenceBasis(
        emptyPayload({
          evidenceListReturned: true,
          evidence: [{ artifactId: "a-1", excerpt: "excerpt" }],
          decisionRuleId: "rule-42",
          decisionRuleName: null,
        }),
      ),
    ).toBe("1 evidence citation. Rule name was not stored. Rule id rule-42.");
  });

  it("distinguishes missing and stored-empty business impact on buyer decision copy", () => {
    expect(buyerFindingDecisionImpactCopy(emptyPayload(), "generic-finding")).toBe(
      "Business impact was not stored",
    );
    expect(
      buyerFindingDecisionImpactCopy(
        emptyPayload({ typedPayload: { businessImpact: "" } as FindingInspectPayload["typedPayload"] }),
        "generic-finding",
      ),
    ).toBe("Business impact was stored empty.");
  });
});
