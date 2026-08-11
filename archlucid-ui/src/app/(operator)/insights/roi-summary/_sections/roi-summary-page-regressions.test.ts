import { describe, expect, it } from "vitest";

import { ROI_SUMMARY_TRAFFIC_PATH } from "@/lib/ui-route-traffic-roi-summary";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";
import { SPONSOR_REPORT_ROI_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";

/**
 * Bundle guard for TB-1971–TB-1974: traffic workbook + view tests in sibling modules.
 * Zero CTA and chrome collapse: `RoiSummaryPageView.test.tsx`.
 */
describe("roi-summary sponsor-report regressions (TB-1975)", () => {
  it("traffic workbook path matches canonical sponsor-report route (TB-1971)", () => {
    expect(ROI_SUMMARY_TRAFFIC_PATH).toBe(SPONSOR_REPORT_ROI_SUMMARY_PATH);
  });

  it("contextual help maps ROI summary to executive-summary pilot ROI measurement (TB-1973)", () => {
    expect(pageHelpTopicForPathname(SPONSOR_REPORT_ROI_SUMMARY_PATH)?.slug).toBe("executive-summary");
    expect(pageHelpTopicForPathname(SPONSOR_REPORT_ROI_SUMMARY_PATH)?.hashFragment).toBe(
      "pilot-roi-measurement",
    );
  });
});
