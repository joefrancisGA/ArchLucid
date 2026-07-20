import { describe, expect, it } from "vitest";

import {
  SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH,
  SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
  SPONSOR_REPORT_PILOT_OUTCOMES_PATH,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
  sponsorReportLegacyRedirectPath,
} from "@/lib/sponsor-report-navigation";

describe("sponsor-report-navigation", () => {
  it("redirects legacy pilot value report path", () => {
    expect(sponsorReportLegacyRedirectPath("/value-report/pilot")).toBe(SPONSOR_REPORT_PILOT_OUTCOMES_PATH);
  });

  it("redirects legacy ROI and executive summary paths", () => {
    expect(sponsorReportLegacyRedirectPath("/value-report/roi")).toBe(SPONSOR_REPORT_ROI_SUMMARY_PATH);
    expect(sponsorReportLegacyRedirectPath("/value-report")).toBe(SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH);
    expect(sponsorReportLegacyRedirectPath("/scorecard")).toBe(SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH);
    expect(sponsorReportLegacyRedirectPath("/sponsor-report")).toBe(SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH);
  });

  it("returns null for unrelated paths", () => {
    expect(sponsorReportLegacyRedirectPath("/reviews")).toBeNull();
    expect(sponsorReportLegacyRedirectPath(SPONSOR_REPORT_PILOT_OUTCOMES_PATH)).toBeNull();
  });
});
