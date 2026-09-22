import { describe, expect, it } from "vitest";

import { buildCompareClassificationBandDeltaView } from "@/lib/review-quality/compare-classification-band-delta";
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
    evidenceRefCount: partial.evidenceRefCount ?? 1,
  } as QuickDecisionFinding;
}

describe("buildCompareClassificationBandDeltaView", () => {
  it("returns null when both reviews have no classified findings", () => {
    expect(
      buildCompareClassificationBandDeltaView({
        baselineFindings: [],
        targetFindings: [],
      }),
    ).toBeNull();
  });

  it("summarizes baseline and target classification counts", () => {
    const view = buildCompareClassificationBandDeltaView({
      baselineFindings: [
        finding({
          findingId: "a",
          title: "A",
          classification: "DecisionGradeFinding",
        }),
      ],
      targetFindings: [
        finding({
          findingId: "b",
          title: "B",
          classification: "ChecklistCoverage",
        }),
        finding({
          findingId: "c",
          title: "C",
          classification: "DecisionGradeFinding",
          evidenceRefCount: 0,
        }),
      ],
    });

    expect(view).not.toBeNull();
    expect(view?.baseline.counts.decisionGrade).toBe(1);
    expect(view?.target.counts.checklist).toBe(1);
    expect(view?.target.counts.decisionGrade).toBe(1);
    expect(view?.target.summaryLine).toContain("Uncited: 1");
  });
});
