import { describe, expect, it } from "vitest";

import { buildCompareSemanticSupportBandDeltaView } from "@/lib/review-quality/compare-semantic-support-band-delta";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

function finding(partial: Partial<QuickDecisionFinding> & Pick<QuickDecisionFinding, "findingId" | "title">): QuickDecisionFinding {
  return {
    findingId: partial.findingId,
    title: partial.title,
    recommendation: partial.recommendation ?? "Fix",
    severityValue: partial.severityValue ?? 2,
    findingOrder: partial.findingOrder ?? 0,
    aiReasoning: partial.aiReasoning ?? {},
    isMuted: partial.isMuted ?? false,
    muteReason: partial.muteReason ?? null,
    enforcementTier: partial.enforcementTier ?? "Blocking",
    classification: partial.classification ?? "DecisionGradeFinding",
    semanticSupportBand: partial.semanticSupportBand ?? null,
  } as QuickDecisionFinding;
}

describe("buildCompareSemanticSupportBandDeltaView", () => {
  it("returns null when both reviews have no decision-grade findings", () => {
    expect(
      buildCompareSemanticSupportBandDeltaView({
        baselineFindings: [],
        targetFindings: [],
      }),
    ).toBeNull();
  });

  it("summarizes baseline and target semantic support counts", () => {
    const view = buildCompareSemanticSupportBandDeltaView({
      baselineFindings: [
        finding({
          findingId: "a",
          title: "A",
          semanticSupportBand: "Supported",
        }),
      ],
      targetFindings: [
        finding({
          findingId: "b",
          title: "B",
          semanticSupportBand: "Unchecked",
        }),
      ],
    });

    expect(view).not.toBeNull();
    expect(view?.baseline.counts.supported).toBe(1);
    expect(view?.target.counts.unchecked).toBe(1);
  });
});
