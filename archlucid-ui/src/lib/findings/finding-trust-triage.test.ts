import { describe, expect, it } from "vitest";

import {
  compareFindingsByTrustThenSeverity,
  extractionFidelitySortPenalty,
  isFindingSponsorPacketTrustEligible,
  reviewFindingMatchesProvenanceFilter,
} from "@/lib/findings/finding-trust-triage";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

function finding(
  overrides: Partial<QuickDecisionFinding> & Pick<QuickDecisionFinding, "findingId">,
): QuickDecisionFinding {
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
    trustLabel: overrides.trustLabel,
    policyRuleId: overrides.policyRuleId,
    evidenceRefCount: overrides.evidenceRefCount,
    confidenceLevel: overrides.confidenceLevel,
  };
}

describe("finding-trust-triage", () => {
  it("keeps deterministic-rule and evidence-backed findings packet-eligible", () => {
    expect(
      isFindingSponsorPacketTrustEligible({ origin: "Deterministic rule", grounding: "Not applicable" }),
    ).toBe(true);
    expect(
      isFindingSponsorPacketTrustEligible({ origin: "AI-generated", grounding: "Evidence-backed" }),
    ).toBe(true);
  });

  it("excludes ungrounded, estimated, fallback, and simulated findings from the packet", () => {
    expect(
      isFindingSponsorPacketTrustEligible({ origin: "AI-generated", grounding: "Ungrounded" }),
    ).toBe(false);
    expect(
      isFindingSponsorPacketTrustEligible({ origin: "AI-generated", grounding: "Estimated" }),
    ).toBe(false);
    expect(
      isFindingSponsorPacketTrustEligible({ origin: "Deterministic fallback", grounding: "Not applicable" }),
    ).toBe(false);
    expect(
      isFindingSponsorPacketTrustEligible({ origin: "Simulated", grounding: "Not applicable" }),
    ).toBe(false);
  });

  it("sorts a warning deterministic-rule finding above a critical ungrounded AI finding", () => {
    const rule = finding({
      findingId: "rule",
      severityValue: 1,
      policyRuleId: "cost-constraint.budget",
    });
    const ungrounded = finding({
      findingId: "ai",
      severityValue: 3,
      trustLabel: "MissingCitation",
      evidenceRefCount: 0,
    });

    expect(compareFindingsByTrustThenSeverity(rule, ungrounded)).toBeLessThan(0);
  });

  it("sorts low-confidence ungrounded findings below same-band evidence-backed peers", () => {
    const evidenceBacked = finding({
      findingId: "evidence",
      severityValue: 2,
      trustLabel: "EvidenceBacked",
      evidenceRefCount: 2,
    });
    const ungroundedLow = finding({
      findingId: "ungrounded",
      severityValue: 3,
      trustLabel: "MissingCitation",
      evidenceRefCount: 0,
      confidenceLevel: "Low",
    });

    expect(extractionFidelitySortPenalty(ungroundedLow)).toBeGreaterThan(
      extractionFidelitySortPenalty(evidenceBacked),
    );
    expect(compareFindingsByTrustThenSeverity(evidenceBacked, ungroundedLow)).toBeLessThan(0);
  });

  it("filters by origin", () => {
    const rule = finding({ findingId: "rule", policyRuleId: "sec.baseline" });
    const ai = finding({ findingId: "ai", trustLabel: "EvidenceBacked", evidenceRefCount: 2 });

    expect(reviewFindingMatchesProvenanceFilter(rule, "Deterministic rule", "all")).toBe(true);
    expect(reviewFindingMatchesProvenanceFilter(ai, "Deterministic rule", "all")).toBe(false);
    expect(reviewFindingMatchesProvenanceFilter(ai, "AI-generated", "Evidence-backed")).toBe(true);
  });
});
