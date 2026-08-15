import { describe, expect, it } from "vitest";

import {
  buildCompareNewFindingTrustLaneRows,
  buildCompareQualityDeltaRows,
  buildWithinReviewClusterKey,
  clusterReviewFindingsByRootCause,
  compareLifecycleSourceAgentTrustLaneLabel,
  deriveCompareQualityDeltaFromGolden,
  listOpenRootCauseClusters,
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

  it("does not fabricate improvement when golden comparison has no deltas", () => {
    const counts = deriveCompareQualityDeltaFromGolden({
      baseRunId: "run-a",
      targetRunId: "run-b",
      summaryHighlights: [],
      decisionChanges: [],
      securityChanges: [],
      requirementChanges: [],
      topologyChanges: [],
      costChanges: [],
    });
    const rows = buildCompareQualityDeltaRows(counts);

    expect(rows.every((row) => row.before === row.after)).toBe(true);
    expect(rows.some((row) => row.improved)).toBe(false);
  });

  it("derives directional counts from golden manifest deltas", () => {
    const counts = deriveCompareQualityDeltaFromGolden({
      baseRunId: "run-a",
      targetRunId: "run-b",
      summaryHighlights: ["Unsupported assumption in intake"],
      decisionChanges: [{ label: "Decision A", before: "open", after: "evidence-backed" }],
      securityChanges: [{ label: "TLS gap", before: "open", after: "closed" }],
      requirementChanges: [{ label: "Req 1", before: "missing", after: "covered" }],
      topologyChanges: [],
      costChanges: [],
    });

    expect(counts).toEqual({
      unsupportedAssumptionsBefore: 2,
      unsupportedAssumptionsAfter: 1,
      highSeverityBefore: 1,
      highSeverityAfter: 0,
      uncoveredMandatoryBefore: 1,
      uncoveredMandatoryAfter: 0,
      evidenceBackedDecisionsBefore: 1,
      evidenceBackedDecisionsAfter: 2,
    });
  });

  it("builds trust lane rows for newly identified lifecycle records", () => {
    const rows = buildCompareNewFindingTrustLaneRows([
      {
        state: "NewlyIdentified",
        resolutionBasis: "NotApplicable",
        priorFindingId: null,
        currentFindingId: "f-1",
        correlationMethod: "PolicyRuleAndFingerprint",
        severity: "High",
        category: "Security",
        message: "TLS gap",
        sourceAgent: "Compliance",
        latestDisposition: null,
      },
      {
        state: "PreviouslyIdentifiedStillPresent",
        resolutionBasis: "NotApplicable",
        priorFindingId: "f-0",
        currentFindingId: "f-2",
        correlationMethod: "PolicyRuleAndFingerprint",
        severity: "Medium",
        category: "Cost",
        message: "Budget",
        sourceAgent: "Cost",
        latestDisposition: null,
      },
    ]);

    expect(rows).toEqual([{ label: compareLifecycleSourceAgentTrustLaneLabel("Compliance"), count: 1 }]);
  });

  it("lists open root-cause clusters with two or more unresolved findings", () => {
    const clusters = listOpenRootCauseClusters([
      finding({ findingId: "a", policyRuleId: "cost.budget" }),
      finding({ findingId: "b", policyRuleId: "cost.budget" }),
      finding({ findingId: "c", policyRuleId: "security.tls" }),
    ]);

    expect(clusters.length).toBe(1);
    expect(clusters[0]?.openCount).toBe(2);
  });
});
