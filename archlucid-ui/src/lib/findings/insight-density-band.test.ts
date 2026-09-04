import { describe, expect, it } from "vitest";

import {
  formatInsightDensityBandLabel,
  INSIGHT_DENSITY_DECISION_GRADE_THRESHOLD,
  INSIGHT_DENSITY_GENERIC_THRESHOLD,
  resolveInsightDensityBand,
} from "@/lib/findings/insight-density-band";

describe("insight-density-band (LI-01)", () => {
  it("maps scores to decision-grade, review, and generic bands", () => {
    expect(resolveInsightDensityBand(INSIGHT_DENSITY_DECISION_GRADE_THRESHOLD)?.id).toBe("decision-grade");
    expect(resolveInsightDensityBand(INSIGHT_DENSITY_GENERIC_THRESHOLD)?.id).toBe("review");
    expect(resolveInsightDensityBand(INSIGHT_DENSITY_GENERIC_THRESHOLD - 1)?.id).toBe("generic");
  });

  it("formats band labels with the numeric score", () => {
    expect(formatInsightDensityBandLabel(82)).toBe("Decision-grade (82)");
    expect(formatInsightDensityBandLabel(55)).toBe("Review (55)");
    expect(formatInsightDensityBandLabel(12)).toBe("Generic (12)");
  });

  it("returns null when score is missing", () => {
    expect(resolveInsightDensityBand(null)).toBeNull();
    expect(formatInsightDensityBandLabel(undefined)).toBeNull();
  });
});
