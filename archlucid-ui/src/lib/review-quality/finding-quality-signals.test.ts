import { describe, expect, it } from "vitest";

import {
  isCannotDetermineReviewFinding,
  isContradictionReviewFinding,
  isCoverageGapReviewFinding,
  isVerifyHypothesisReviewFinding,
} from "@/lib/review-quality/finding-quality-signals";
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
    trustLabel: overrides.trustLabel,
    policyRuleId: overrides.policyRuleId,
    evidenceRefCount: overrides.evidenceRefCount,
    confidenceLevel: overrides.confidenceLevel,
  };
}

describe("finding-quality-signals", () => {
  it("detects cannot-determine phrasing", () => {
    const row = finding({
      findingId: "f-1",
      title: "Recovery objective cannot be verified",
      recommendation: "Insufficient evidence to confirm RTO",
    });

    expect(isCannotDetermineReviewFinding(row)).toBe(true);
  });

  it("detects verify-hypothesis ungrounded AI findings", () => {
    const row = finding({
      findingId: "f-2",
      trustLabel: "Heuristic",
      evidenceRefCount: 0,
    });

    expect(isVerifyHypothesisReviewFinding(row)).toBe(true);
  });

  it("detects adversarial open-question phrasing in verify-hypothesis lane", () => {
    const row = finding({
      findingId: "f-adv",
      title: "Adversarial challenge: cross-region failover may be overstated",
      recommendation: "Falsify/confirm with: inventory-backed recovery tier evidence",
      aiReasoning: { wireJson: "{}", reasoningTrace: "" },
      evidenceRefCount: 0,
      trustLabel: "MissingCitation",
    });

    expect(isVerifyHypothesisReviewFinding(row)).toBe(true);
  });

  it("detects contradiction findings", () => {
    const row = finding({
      findingId: "f-3",
      title: "Diagram vs narrative contradiction on database tier",
    });

    expect(isContradictionReviewFinding(row)).toBe(true);
  });

  it("detects adversarial lane from architecture intelligence wire properties", () => {
    const row = finding({
      findingId: "f-hypothesis",
      title: "Challenge finding: backup assumption",
      recommendation: "Falsify/confirm with: recovery tier inventory",
      severityValue: 1,
      aiReasoning: {
        wireJson: JSON.stringify({
          properties: {
            "architectureIntelligence.adversarialLane": "AdversarialChallenge",
            "architectureIntelligence.provenancePresentation": "Hypothesis",
          },
        }),
        reasoningTrace: "",
      },
    });

    expect(isVerifyHypothesisReviewFinding(row)).toBe(true);
    expect(isCannotDetermineReviewFinding(row)).toBe(false);
  });
});
