import { describe, expect, it } from "vitest";

import { PILOT_OUTCOMES_TRAFFIC_PATH } from "@/lib/ui-route-traffic-pilot-outcomes";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";
import { SPONSOR_REPORT_PILOT_OUTCOMES_PATH } from "@/lib/sponsor-report-navigation";

/**
 * Bundle guard for TB-1966–TB-1969: traffic workbook + view tests in sibling modules.
 * Empty deep-link, help mount, and chrome collapse: `PilotValueReportPageView.test.tsx`.
 */
describe("pilot-outcomes sponsor-report regressions (TB-1970)", () => {
  it("traffic workbook path matches canonical sponsor-report route (TB-1966)", () => {
    expect(PILOT_OUTCOMES_TRAFFIC_PATH).toBe(SPONSOR_REPORT_PILOT_OUTCOMES_PATH);
  });

  it("contextual help maps pilot outcomes to pilot-outcomes specialty guide (TB-1968)", () => {
    expect(pageHelpTopicForPathname(SPONSOR_REPORT_PILOT_OUTCOMES_PATH)?.slug).toBe("pilot-outcomes");
  });
});
