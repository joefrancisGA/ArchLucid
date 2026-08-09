import { describe, expect, it } from "vitest";

import {
  SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH,
  SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
  SPONSOR_REPORT_PILOT_OUTCOMES_PATH,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
  isSponsorReportOutcomesSurface,
} from "@/lib/sponsor-report-navigation";

describe("sponsor-report-navigation", () => {
  it("detects sponsor report outcome surfaces", () => {
    expect(isSponsorReportOutcomesSurface(SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH)).toBe(true);
    expect(isSponsorReportOutcomesSurface(SPONSOR_REPORT_PILOT_OUTCOMES_PATH)).toBe(true);
    expect(isSponsorReportOutcomesSurface(SPONSOR_REPORT_ROI_SUMMARY_PATH)).toBe(true);
    expect(isSponsorReportOutcomesSurface(SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH)).toBe(true);
  });

  it("does not treat retired legacy bookmarks as sponsor report surfaces", () => {
    expect(isSponsorReportOutcomesSurface("/value-report")).toBe(false);
    expect(isSponsorReportOutcomesSurface("/architecture/reviews")).toBe(false);
  });

  it("detects insights sponsor-report outcome paths", () => {
    expect(isSponsorReportOutcomesSurface("/insights/roi-summary")).toBe(true);
    expect(isSponsorReportOutcomesSurface("/insights/pilot-outcomes")).toBe(true);
  });

  it("does not treat retired /sponsor-report bookmarks as live surfaces", () => {
    expect(isSponsorReportOutcomesSurface("/sponsor-report/executive-summary")).toBe(false);
    expect(isSponsorReportOutcomesSurface("/sponsor-report/pilot-outcomes")).toBe(false);
  });
});
