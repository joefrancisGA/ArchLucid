import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import {
  countFindingsByClassificationBand,
  filterFindingsByClassificationBand,
} from "@/lib/findings/review-detail-findings-classification-band";

function finding(
  overrides: Partial<QuickDecisionFinding> & Pick<QuickDecisionFinding, "findingId">,
): QuickDecisionFinding {
  return {
    findingId: overrides.findingId,
    title: overrides.title ?? overrides.findingId,
    recommendation: overrides.recommendation ?? "detail",
    severityValue: overrides.severityValue ?? 1,
    findingOrder: overrides.findingOrder ?? 0,
    aiReasoning: overrides.aiReasoning ?? { wireJson: "{}", reasoningTrace: "detail" },
    isMuted: overrides.isMuted ?? false,
    muteReason: overrides.muteReason ?? null,
    enforcementTier: overrides.enforcementTier ?? "baseline",
    classification: overrides.classification ?? null,
    insightDensityScore: overrides.insightDensityScore ?? null,
  };
}

describe("review-detail-findings-classification-band (IS-07)", () => {
  const fixtures = [
    finding({ findingId: "dg-1", classification: "DecisionGradeFinding" }),
    finding({ findingId: "cl-1", classification: "ChecklistCoverage" }),
  ];

  it("defaults decision-grade band to hide checklist rows", () => {
    const band = filterFindingsByClassificationBand(fixtures, "decision-grade");

    expect(band.map((row) => row.findingId)).toEqual(["dg-1"]);
  });

  it("shows checklist rows on the checklist band", () => {
    const band = filterFindingsByClassificationBand(fixtures, "checklist");

    expect(band.map((row) => row.findingId)).toEqual(["cl-1"]);
  });

  it("counts both bands for tab labels", () => {
    expect(countFindingsByClassificationBand(fixtures)).toEqual({
      decisionGrade: 1,
      checklist: 1,
    });
  });
});
