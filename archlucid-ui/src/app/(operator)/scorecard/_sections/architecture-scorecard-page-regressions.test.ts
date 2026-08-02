import { describe, expect, it } from "vitest";

import { ARCHITECTURE_SCORECARD_TRAFFIC_PATH } from "@/lib/ui-route-traffic-architecture-scorecard";
import { REVIEW_SCORECARD_SAMPLE_HREF } from "@/lib/review-scorecard-empty-state";
import { SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH } from "@/lib/sponsor-report-navigation";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

/**
 * Bundle guard for TB-1956–TB-1959: traffic workbook + view tests in sibling modules.
 */
describe("architecture-scorecard sponsor-report regressions (TB-1959)", () => {
  it("traffic workbook path matches canonical sponsor-report route (TB-1956)", () => {
    expect(ARCHITECTURE_SCORECARD_TRAFFIC_PATH).toBe(SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH);
  });

  it("sample href uses canonical SPA path with sample query (TB-1957)", () => {
    expect(REVIEW_SCORECARD_SAMPLE_HREF).toBe(`${SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH}?sample=1`);
  });

  it("contextual help maps architecture scorecard to pilot-roi-model (TB-1959)", () => {
    expect(pageHelpTopicForPathname(SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH)?.slug).toBe("pilot-roi-model");
  });
});
