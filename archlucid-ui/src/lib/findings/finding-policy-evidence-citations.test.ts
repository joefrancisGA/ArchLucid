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
    expect(model.pack).toBeNull();
    expect(model.evidence[0]?.label).toContain("terraform/network.bicep");
    expect(model.evidence[0]?.href).toBe("");
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
    ).toBe("Subnet allows public ingress on port 443.");
  });

  it("labels stored evidenceRefCount without snippets without implying linked excerpts (P-04)", () => {
    const finding: QuickDecisionFinding = {
      findingId: "f-count",
      title: "Gap",
      recommendation: "Review.",
      severityValue: 2,
      findingOrder: 0,
      aiReasoning: { wireJson: "{}", reasoningTrace: "" },
      isMuted: false,
      muteReason: null,
      enforcementTier: "PolicyViolation",
      policyRuleId: "sec-base-010",
      evidenceRefSnippets: [],
      evidenceRefCount: 2,
    };

    const model = buildFindingPolicyEvidenceCitationsFromQuickDecision("run-9", finding);

    expect(model.evidence[0]?.label).toBe("2 evidence references were stored without excerpts.");
    expect(model.evidence[0]?.label).not.toContain("linked evidence");
  });

  it("labels omitted evidenceRefCount without synthetic linked-reference rows (P-04)", () => {
    const finding: QuickDecisionFinding = {
      findingId: "f-omitted",
      title: "Gap",
      recommendation: "Review.",
      severityValue: 2,
      findingOrder: 0,
      aiReasoning: { wireJson: "{}", reasoningTrace: "" },
      isMuted: false,
      muteReason: null,
      enforcementTier: "PolicyViolation",
      policyRuleId: "sec-base-010",
      evidenceRefSnippets: [],
      evidenceRefCount: null,
    };

    const model = buildFindingPolicyEvidenceCitationsFromQuickDecision("run-9", finding);

    expect(model.evidence).toHaveLength(1);
    expect(model.evidence[0]?.label).toBe("Evidence reference count was not stored.");
    expect(model.evidence[0]?.label).not.toContain("linked evidence reference");
  });

  it("keeps em-dash clauses in citation labels", () => {
    expect(
      findingInspectEvidenceCitationLabel({
        artifactId: null,
        lineRange: null,
        excerpt: "Private endpoint — connection status was not stored.",
      }),
    ).toContain("connection status was not stored");
  });

  it("labels missing evidence excerpt explicitly", () => {
    expect(
      findingInspectEvidenceCitationLabel({
        artifactId: null,
        lineRange: null,
        excerpt: null,
      }),
    ).toBe("Evidence excerpt was not stored.");
  });

  it("labels hyphen artifact id without inventing a citation title (storage-account)", () => {
    expect(
      findingInspectEvidenceCitationLabel({
        artifactId: "storage-account",
        lineRange: null,
        excerpt: "",
      }),
    ).toBe("Evidence artifact id storage-account. A citation title was not stored.");
  });

  it("does not infer policy pack from waf-az rule id alone", () => {
    const finding: QuickDecisionFinding = {
      findingId: "f-waf",
      title: "WAF gap",
      recommendation: "Fix.",
      severityValue: 2,
      findingOrder: 0,
      aiReasoning: { wireJson: "{}", reasoningTrace: "" },
      isMuted: false,
      muteReason: null,
      enforcementTier: "PolicyViolation",
      policyRuleId: "waf-az-004",
      evidenceRefSnippets: [],
      evidenceRefCount: 0,
    };

    const model = buildFindingPolicyEvidenceCitationsFromQuickDecision("run-9", finding);

    expect(model.pack).toBeNull();
    expect(model.policy?.ruleId).toBe("waf-az-004");
  });
});
