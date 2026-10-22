import { describe, expect, it } from "vitest";

import {
  RETIRED_PILOT_OUTCOMES_PATH,
  RETIRED_ROI_SUMMARY_PATH,
  RETIRED_SPONSOR_SUMMARY_PATH,
  SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH,
  SPONSOR_REPORT_PATH,
  SPONSOR_REPORT_PAGE_TITLE,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
  SPONSOR_REPORT_SECTION_LABEL,
  isSponsorReportOutcomesSurface,
} from "@/lib/sponsor-report-navigation";

describe("sponsor-report-navigation", () => {
  it("detects sponsor report outcome surfaces", () => {
    expect(isSponsorReportOutcomesSurface(SPONSOR_REPORT_PATH)).toBe(true);
    expect(isSponsorReportOutcomesSurface(SPONSOR_REPORT_ROI_SUMMARY_PATH)).toBe(true);
    expect(isSponsorReportOutcomesSurface(SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH)).toBe(true);
  });

  it("does not treat retired legacy bookmarks as sponsor report surfaces", () => {
    expect(isSponsorReportOutcomesSurface("/value-report")).toBe(false);
    expect(isSponsorReportOutcomesSurface("/architecture/reviews")).toBe(false);
  });

  it("detects insights sponsor-report outcome paths", () => {
    expect(isSponsorReportOutcomesSurface("/insights/roi-summary")).toBe(true);
  });

  it("does not treat retired /sponsor-report bookmarks as live surfaces", () => {
    expect(isSponsorReportOutcomesSurface("/sponsor-report/sponsor-report")).toBe(false);
    expect(isSponsorReportOutcomesSurface("/sponsor-report/pilot-outcomes")).toBe(false);
  });

  it("treats the merged-away pilot outcomes route as retired, not a live outcomes surface", () => {
    expect(RETIRED_PILOT_OUTCOMES_PATH).toBe("/insights/pilot-outcomes");
    expect(isSponsorReportOutcomesSurface(RETIRED_PILOT_OUTCOMES_PATH)).toBe(false);
  });

  it("keeps retired sponsor-summary and value-report ROI bookmarks distinct from live surfaces", () => {
    expect(RETIRED_SPONSOR_SUMMARY_PATH).toBe("/insights/sponsor-summary");
    expect(RETIRED_ROI_SUMMARY_PATH).toBe("/value-report/roi");
    expect(isSponsorReportOutcomesSurface(RETIRED_SPONSOR_SUMMARY_PATH)).toBe(false);
    expect(isSponsorReportOutcomesSurface(RETIRED_ROI_SUMMARY_PATH)).toBe(false);
  });

  it("keeps the page title distinct from the nav section label", () => {
    expect(SPONSOR_REPORT_PAGE_TITLE).toBe("Sponsor report");
    expect(SPONSOR_REPORT_SECTION_LABEL).toBe("Insights");
    expect(SPONSOR_REPORT_PAGE_TITLE).not.toBe(SPONSOR_REPORT_SECTION_LABEL);
  });
});
