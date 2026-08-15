import { describe, expect, it } from "vitest";

import {
  buildCompareQualityDeltaRows,
  buildWithinReviewClusterKey,
  clusterReviewFindingsByRootCause,
} from "@/lib/review-quality/compare-quality-delta";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

function finding(overrides: Partial<QuickDecisionFinding> & Pick<QuickDecisionFinding, "findingId">): QuickDecisionFinding {
  return {
    findingId: overrides.findingId,
    title: overrides.title ?? "Finding",
    recommendation: overrides.recommendation ?? "Fix it",
    severityValue: overrides.severityValue ?? 2,
    findingOrder: overrides.findingOrder ?? 0,
    aiReasoning: overrides.aiReasoning ?? { wireJson: "{}", reasoningTrace: "" },
    isMuted: overrides.isMuted ?? false,
    muteReason: overrides.muteReason ?? null,
    enforcementTier: overrides.enforcementTier ?? "PolicyViolation",
    humanReviewStatus: overrides.humanReviewStatus ?? 1,
    policyRuleId: overrides.policyRuleId,
  };
}

describe("compare-quality-delta", () => {
  it("builds auditable delta rows", () => {
    const rows = buildCompareQualityDeltaRows({
      unsupportedAssumptionsBefore: 9,
      unsupportedAssumptionsAfter: 2,
      highSeverityBefore: 7,
      highSeverityAfter: 1,
      uncoveredMandatoryBefore: 8,
      uncoveredMandatoryAfter: 2,
      evidenceBackedDecisionsBefore: 48,
      evidenceBackedDecisionsAfter: 86,
    });

    expect(rows[0]?.improved).toBe(true);
    expect(rows[3]?.improved).toBe(true);
  });

  it("clusters findings by policy rule id", () => {
    const clusters = clusterReviewFindingsByRootCause([
      finding({ findingId: "a", policyRuleId: "cost.budget" }),
      finding({ findingId: "b", policyRuleId: "cost.budget" }),
      finding({ findingId: "c", policyRuleId: "security.encryption" }),
    ]);

    expect(clusters.get("rule:cost.budget")?.length).toBe(2);
    expect(buildWithinReviewClusterKey(finding({ findingId: "d", policyRuleId: "foo" }))).toBe("rule:foo");
  });
});
