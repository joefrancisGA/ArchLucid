import { describe, expect, it } from "vitest";

import {
  SCORECARD_ROI_COMPACT_LINE,
  SCORECARD_ROI_HEADING,
  SCORECARD_ROI_ROI_SUMMARY_LINK,
  SCORECARD_ROI_SCORECARD_LINK,
  SCORECARD_ROI_WHY_TWO,
  buildScorecardRoiVocabulary,
  resolveScorecardRoiPeerLink,
} from "@/lib/vocabulary/scorecard-roi-vocabulary";
import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture-scorecard-route";
import { SPONSOR_REPORT_ROI_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";

describe("scorecard-roi-vocabulary (TB-2265)", () => {
  it("explains scorecard pilot KPIs vs ROI portfolio framing", () => {
    const model = buildScorecardRoiVocabulary();

    expect(model.heading).toBe(SCORECARD_ROI_HEADING);
    expect(model.heading.toLowerCase()).toContain("scorecard");
    expect(model.heading.toLowerCase()).toContain("roi summary");
    expect(model.whyTwo).toBe(SCORECARD_ROI_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("pilot");
    expect(model.whyTwo.toLowerCase()).toContain("portfolio");
    expect(model.whyTwo.toLowerCase()).not.toContain("sponsor export");
    expect(model.compactLine).toBe(SCORECARD_ROI_COMPACT_LINE);

    expect(model.scorecardLink).toEqual(SCORECARD_ROI_SCORECARD_LINK);
    expect(model.scorecardLink.href).toBe(ARCHITECTURE_SCORECARD_PATH);
    expect(model.scorecardLink.href).toBe("/insights/architecture-scorecard");

    expect(model.roiSummaryLink).toEqual(SCORECARD_ROI_ROI_SUMMARY_LINK);
    expect(model.roiSummaryLink.href).toBe(SPONSOR_REPORT_ROI_SUMMARY_PATH);
    expect(model.roiSummaryLink.href).toBe("/insights/roi-summary");
  });

  it("resolves the peer surface from scorecard and roi-summary", () => {
    expect(resolveScorecardRoiPeerLink("scorecard")).toEqual(SCORECARD_ROI_ROI_SUMMARY_LINK);
    expect(resolveScorecardRoiPeerLink("roi-summary")).toEqual(SCORECARD_ROI_SCORECARD_LINK);
  });
});
