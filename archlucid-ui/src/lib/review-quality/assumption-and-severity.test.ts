import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import { deriveOpenUnverifiedAssumptionTextsForReview } from "./assumption-and-severity";

function sampleFinding(
  partial: Partial<QuickDecisionFinding> & Pick<QuickDecisionFinding, "findingId">,
): QuickDecisionFinding {
  return {
    findingId: partial.findingId,
    title: partial.title ?? "Sample finding",
    recommendation: partial.recommendation ?? "",
    severityValue: partial.severityValue ?? 1,
    findingOrder: partial.findingOrder ?? 0,
    isMuted: partial.isMuted ?? false,
    muteReason: partial.muteReason ?? null,
    enforcementTier: partial.enforcementTier ?? "Blocking",
    humanReviewStatus: partial.humanReviewStatus ?? null,
    trustLabel: partial.trustLabel ?? null,
    policyRuleId: partial.policyRuleId ?? null,
    evidenceRefCount: partial.evidenceRefCount ?? 0,
    confidenceLevel: partial.confidenceLevel ?? null,
    aiReasoning: partial.aiReasoning ?? {
      reasoningTrace: "",
      wireJson: "{}",
    },
  };
}

describe("deriveOpenUnverifiedAssumptionTextsForReview", () => {
  it("excludes disposition-closed assumption findings from the confirmation strip", () => {
    const texts = deriveOpenUnverifiedAssumptionTextsForReview(
      [
        sampleFinding({
          findingId: "a1",
          title: "Assumption about cache",
          humanReviewStatus: 2,
        }),
      ],
      [],
    );

    expect(texts).toHaveLength(0);
  });
});
