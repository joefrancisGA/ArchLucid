import { describe, expect, it } from "vitest";

import {
  BASELINE_ROI_BASELINE_LINK,
  BASELINE_ROI_COMPACT_LINE,
  BASELINE_ROI_HEADING,
  BASELINE_ROI_ROI_SUMMARY_LINK,
  BASELINE_ROI_WHY_TWO,
  buildBaselineRoiVocabulary,
  resolveBaselineRoiPeerLink,
} from "@/lib/baseline-roi-vocabulary";
import { BASELINE_SETTINGS_CANONICAL_PATH } from "@/lib/baseline-settings-evidence-copy";
import { SPONSOR_REPORT_ROI_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";

describe("baseline-roi-vocabulary (TB-2275)", () => {
  it("explains baseline cost inputs vs ROI portfolio framing", () => {
    const model = buildBaselineRoiVocabulary();

    expect(model.heading).toBe(BASELINE_ROI_HEADING);
    expect(model.heading.toLowerCase()).toContain("baseline");
    expect(model.heading.toLowerCase()).toContain("roi summary");
    expect(model.whyTwo).toBe(BASELINE_ROI_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("cost");
    expect(model.whyTwo.toLowerCase()).toContain("portfolio");
    expect(model.whyTwo.toLowerCase()).not.toContain("scorecard");
    expect(model.whyTwo.toLowerCase()).not.toContain("sponsor export");
    expect(model.compactLine).toBe(BASELINE_ROI_COMPACT_LINE);

    expect(model.baselineLink).toEqual(BASELINE_ROI_BASELINE_LINK);
    expect(model.baselineLink.href).toBe(BASELINE_SETTINGS_CANONICAL_PATH);
    expect(model.baselineLink.href).toBe("/administration/baseline");

    expect(model.roiSummaryLink).toEqual(BASELINE_ROI_ROI_SUMMARY_LINK);
    expect(model.roiSummaryLink.href).toBe(SPONSOR_REPORT_ROI_SUMMARY_PATH);
    expect(model.roiSummaryLink.href).toBe("/insights/roi-summary");
  });

  it("resolves the peer surface from baseline and roi-summary", () => {
    expect(resolveBaselineRoiPeerLink("baseline")).toEqual(BASELINE_ROI_ROI_SUMMARY_LINK);
    expect(resolveBaselineRoiPeerLink("roi-summary")).toEqual(BASELINE_ROI_BASELINE_LINK);
  });
});
