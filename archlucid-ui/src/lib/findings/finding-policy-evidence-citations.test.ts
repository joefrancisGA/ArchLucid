import { describe, expect, it } from "vitest";

import {
  buildFindingPolicyEvidenceCitationsFromInspect,
  buildFindingPolicyEvidenceCitationsFromQuickDecision,
  coercePolicyRuleIdFromFindingWire,
  findingInspectEvidenceCitationLabel,
  resolvePolicyTraceExcerptFromInspect,
} from "@/lib/findings/finding-policy-evidence-citations";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { FindingInspectPayload } from "@/types/finding-inspect";

const inspectPayload = (overrides: Partial<FindingInspectPayload> = {}): FindingInspectPayload => ({
  findingId: "f-1",
  typedPayload: null,
  decisionRuleId: "sec-base-001",
  decisionRuleName: "Security Architecture Baseline rule",
  evidence: [
    {
      artifactId: "claims-intake-schema",
      lineRange: "42-48",
      excerpt: "Request schema includes unredacted member ID fields.",
    },
  ],
  recommendedActions: [],
  auditRowId: null,
  runId: "run-1",
  manifestVersion: "1.0.0",
  ...overrides,
});

describe("finding-policy-evidence-citations", () => {
  it("buildFindingPolicyEvidenceCitationsFromInspect links policy rule and evidence", () => {
    const model = buildFindingPolicyEvidenceCitationsFromInspect("run-1", "f-1", inspectPayload());

    expect(model.pack).toBeNull();
    expect(model.policy).toEqual({
      ruleId: "sec-base-001",
      ruleLabel: "Security Architecture Baseline rule",
      href: "/governance/policy-packs?ruleId=sec-base-001",
    });
    expect(model.evidence).toHaveLength(1);
    expect(model.evidence[0]?.label).toContain("Request schema");
    expect(model.evidence[0]?.detail).toBe("Lines 42-48 · claims-intake-schema");
    expect(model.evidence[0]?.href).toContain("/architecture/reviews/run-1#artifacts-exports");
  });

  it("buildFindingPolicyEvidenceCitationsFromInspect resolves policy pack metadata from typed payload", () => {
    const model = buildFindingPolicyEvidenceCitationsFromInspect(
      "run-1",
      "f-1",
      inspectPayload({
        typedPayload: {
          policyPackId: "healthcare-claims-v3",
          policyPackName: "Enterprise Privacy Policy Pack v3",
        },
      }),
    );

    expect(model.pack).toEqual({
      packId: "healthcare-claims-v3",
      packName: "Enterprise Privacy Policy Pack v3",
      href: "/governance/policy-packs?packId=healthcare-claims-v3",
    });
  });

  it("resolvePolicyTraceExcerptFromInspect prefers reasoningSummary", () => {
    expect(
      resolvePolicyTraceExcerptFromInspect(
        inspectPayload({
          reasoningSummary: "Evidence shows public ingress.",
        }),
      ),
    ).toBe("Evidence shows public ingress.");
  });

  it("falls back to typed payload policyRuleId when decisionRuleId is absent", () => {
    const model = buildFindingPolicyEvidenceCitationsFromInspect(
      "run-1",
      "f-1",
      inspectPayload({
        decisionRuleId: null,
        decisionRuleName: null,
        typedPayload: { policyRuleId: "cost-opt-003" },
      }),
    );

    expect(model.policy?.ruleId).toBe("cost-opt-003");
    expect(model.policy?.href).toBe("/governance/policy-packs?ruleId=cost-opt-003");
  });

  it("buildFindingPolicyEvidenceCitationsFromQuickDecision uses policyRuleId and evidence snippets", () => {
    const finding: QuickDecisionFinding = {
      findingId: "f-2",
      title: "Open NSG",
      recommendation: "Restrict inbound.",
      severityValue: 2,
      findingOrder: 0,
      aiReasoning: { wireJson: "{}", reasoningTrace: "" },
      isMuted: false,
      muteReason: null,
      enforcementTier: "PolicyViolation",
      policyRuleId: "sec-base-010",
      evidenceRefSnippets: ["terraform/network.bicep:120 — allow-all inbound rule"],
      evidenceRefCount: 1,
    };

    const model = buildFindingPolicyEvidenceCitationsFromQuickDecision("run-9", finding);

    expect(model.policy?.ruleId).toBe("sec-base-010");
    expect(model.pack?.packName).toBe("Security Architecture Baseline");
    expect(model.evidence[0]?.label).toContain("terraform/network.bicep");
    expect(model.evidence[0]?.href).toContain("/architecture/reviews/run-9#artifacts-exports");
  });

  it("coercePolicyRuleIdFromFindingWire reads policyRuleId from wire JSON", () => {
    expect(coercePolicyRuleIdFromFindingWire({ policyRuleId: " arc-ampe-pillar-security " })).toBe("arc-ampe-pillar-security");
    expect(coercePolicyRuleIdFromFindingWire({})).toBeNull();
  });

  it("findingInspectEvidenceCitationLabel prefers excerpt over artifact id", () => {
    expect(
      findingInspectEvidenceCitationLabel({
        artifactId: "artifact-1",
        lineRange: null,
        excerpt: "Subnet allows public ingress on port 443.",
      }),
    ).toBe("Subnet allows public ingress on port 443");
  });
});
