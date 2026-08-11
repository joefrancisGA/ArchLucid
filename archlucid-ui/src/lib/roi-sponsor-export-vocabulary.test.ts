import { describe, expect, it } from "vitest";

import {
  ROI_SPONSOR_EXPORT_COMPACT_LINE,
  ROI_SPONSOR_EXPORT_EXECUTIVE_DASHBOARD_LINK,
  ROI_SPONSOR_EXPORT_HEADING,
  ROI_SPONSOR_EXPORT_ROI_SUMMARY_LINK,
  ROI_SPONSOR_EXPORT_SPONSOR_HANDOFF_LINK,
  ROI_SPONSOR_EXPORT_WHY_TWO,
  buildRoiSponsorExportHandoffHref,
  buildRoiSponsorExportVocabulary,
  resolveRoiSponsorExportPeerLink,
} from "@/lib/roi-sponsor-export-vocabulary";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";
import { SPONSOR_REPORT_ROI_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";

describe("roi-sponsor-export-vocabulary (TB-2258)", () => {
  it("explains portfolio KPI vs per-package sponsor send and deep-links both", () => {
    const model = buildRoiSponsorExportVocabulary();

    expect(model.heading).toBe(ROI_SPONSOR_EXPORT_HEADING);
    expect(model.heading.toLowerCase()).toContain("roi");
    expect(model.heading.toLowerCase()).toContain("sponsor export");
    expect(model.whyTwo).toBe(ROI_SPONSOR_EXPORT_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("portfolio kpi");
    expect(model.whyTwo.toLowerCase()).toContain("per-package");
    expect(model.compactLine).toBe(ROI_SPONSOR_EXPORT_COMPACT_LINE);

    expect(model.roiSummaryLink).toEqual(ROI_SPONSOR_EXPORT_ROI_SUMMARY_LINK);
    expect(model.roiSummaryLink.href).toBe(SPONSOR_REPORT_ROI_SUMMARY_PATH);
    expect(model.roiSummaryLink.href).toBe("/insights/roi-summary");

    expect(model.sponsorHandoffLink).toEqual(ROI_SPONSOR_EXPORT_SPONSOR_HANDOFF_LINK);
    expect(model.executiveDashboardLink).toEqual(ROI_SPONSOR_EXPORT_EXECUTIVE_DASHBOARD_LINK);
    expect(model.executiveDashboardLink.href).toBe(EXECUTIVE_DASHBOARD_HREF);
  });

  it("resolves peers between ROI summary and sponsor export surfaces", () => {
    expect(resolveRoiSponsorExportPeerLink("roi-summary")).toEqual(
      ROI_SPONSOR_EXPORT_SPONSOR_HANDOFF_LINK,
    );
    expect(resolveRoiSponsorExportPeerLink("sponsor-handoff")).toEqual(
      ROI_SPONSOR_EXPORT_ROI_SUMMARY_LINK,
    );
    expect(resolveRoiSponsorExportPeerLink("executive-dashboard")).toEqual(
      ROI_SPONSOR_EXPORT_ROI_SUMMARY_LINK,
    );
  });

  it("builds run-scoped sponsor handoff href when a review id is present", () => {
    expect(buildRoiSponsorExportHandoffHref(null)).toBe(ROI_SPONSOR_EXPORT_SPONSOR_HANDOFF_LINK.href);
    expect(buildRoiSponsorExportHandoffHref("")).toBe(ROI_SPONSOR_EXPORT_SPONSOR_HANDOFF_LINK.href);
    expect(buildRoiSponsorExportHandoffHref("run-123")).toBe(
      "/architecture/reviews/run-123#sponsor-handoff",
    );
  });
});
