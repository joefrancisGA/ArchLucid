import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import { deriveReviewNextActionLabel } from "./review-presentation";

function sampleFinding(
  partial: Partial<QuickDecisionFinding> & Pick<QuickDecisionFinding, "findingId">,
): QuickDecisionFinding {
  return {
    findingId: partial.findingId,
    title: partial.title ?? "Open finding",
    recommendation: partial.recommendation ?? "",
    severityValue: partial.severityValue ?? 1,
    findingOrder: partial.findingOrder ?? 0,
    isMuted: partial.isMuted ?? false,
    muteReason: partial.muteReason ?? null,
    enforcementTier: partial.enforcementTier ?? "Blocking",
    humanReviewStatus: partial.humanReviewStatus ?? null,
    evidenceRefCount: partial.evidenceRefCount !== undefined ? partial.evidenceRefCount : 0,
    aiReasoning: partial.aiReasoning ?? {
      reasoningTrace: "",
      wireJson: "{}",
    },
  };
}

describe("deriveReviewNextActionLabel (P-20)", () => {
  it("uses not-stored copy when primary finding omits evidenceRefCount", () => {
    const label = deriveReviewNextActionLabel({
      recommendedActions: [],
      primaryConcernFinding: sampleFinding({
        findingId: "f-1",
        title: "Public ingress",
        evidenceRefCount: null,
        humanReviewStatus: 2,
      }),
      blockingFindingCount: 0,
    });

    expect(label).toContain("Evidence reference count was not stored");
    expect(label).toContain("Public ingress");
  });
});
