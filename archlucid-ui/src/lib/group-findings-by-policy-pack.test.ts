import { describe, expect, it } from "vitest";

import {
  groupQuickDecisionFindingsByPolicyPack,
  summarizePolicyPackFindingImpact,
  summarizeQuickDecisionFindingsByPolicyPack,
} from "./group-findings-by-policy-pack";
import {
  CLAIMS_INTAKE_POLICY_PACK_DETAIL_HREF,
  CLAIMS_INTAKE_RULE_SET_VERSION,
  CLAIMS_INTAKE_SAMPLE_DEFINITION,
} from "@/lib/samples/claims-intake/definition";
import type { QuickDecisionFinding } from "./quick-decision-summary-derive";

function finding(partial: Partial<QuickDecisionFinding> & Pick<QuickDecisionFinding, "findingId" | "title">): QuickDecisionFinding {
  return {
    recommendation: "",
    severityValue: 2,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "PolicyViolation",
    ...partial,
  };
}

describe("group-findings-by-policy-pack", () => {
  it("groups findings by inferred bundled pack from compliance rule keys", () => {
    const findings = [
      finding({ findingId: "f1", title: "A", policyRuleId: "sec-base-001" }),
      finding({ findingId: "f2", title: "B", policyRuleId: "sec-base-010" }),
      finding({ findingId: "f3", title: "C", policyRuleId: "waf-az-004" }),
    ];

    const summary = summarizeQuickDecisionFindingsByPolicyPack(findings);
    const grouped = groupQuickDecisionFindingsByPolicyPack(findings);

    expect(summary).toEqual([
      {
        groupKey: "security architecture baseline",
        packDisplayName: "Security Architecture Baseline",
        findingCount: 2,
        packHref: "/governance/policy-packs?ruleId=sec-base-001",
      },
      {
        groupKey: "azure well-architected framework",
        packDisplayName: "Azure Well-Architected Framework",
        findingCount: 1,
        packHref: "/governance/policy-packs?ruleId=waf-az-004",
      },
    ]);
    expect(grouped).toHaveLength(2);
    expect(grouped[0]?.findings.map((row) => row.findingId)).toEqual(["f1", "f2"]);
  });

  it("falls back to manifest rule set label when rule keys are absent", () => {
    const findings = [finding({ findingId: "f1", title: "A" })];

    const summary = summarizeQuickDecisionFindingsByPolicyPack(
      findings,
      CLAIMS_INTAKE_SAMPLE_DEFINITION.ruleSetId,
      CLAIMS_INTAKE_RULE_SET_VERSION,
    );

    expect(summary[0]?.packDisplayName).toBe(
      `${CLAIMS_INTAKE_SAMPLE_DEFINITION.policyPackDisplayLabel} v${CLAIMS_INTAKE_RULE_SET_VERSION}`,
    );
    expect(summary[0]?.packHref).toBe(CLAIMS_INTAKE_POLICY_PACK_DETAIL_HREF);
  });

  it("summarizePolicyPackFindingImpact counts mapped vs unmapped findings", () => {
    const findings = [
      finding({ findingId: "f1", title: "A", policyRuleId: "sec-base-001" }),
      finding({ findingId: "f2", title: "B" }),
    ];

    const impact = summarizePolicyPackFindingImpact(findings);

    expect(impact.totalFindings).toBe(2);
    expect(impact.mappedFindingCount).toBe(1);
    expect(impact.unmappedFindingCount).toBe(1);
  });
});
