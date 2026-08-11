import { describe, expect, it } from "vitest";

import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer-polish-copy";
import { ARCHITECTURE_SCORECARD_TRAFFIC_PATH } from "@/lib/ui-route-traffic-architecture-scorecard";
import {
  REVIEW_SCORECARD_EMPTY_PRIMARY_CTA,
  REVIEW_SCORECARD_SAMPLE_HREF,
} from "@/lib/review-scorecard-empty-state";
import { SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH } from "@/lib/sponsor-report-navigation";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

/**
 * Bundle guard for TB-1956–TB-1959 (TB-1960): traffic workbook + view tests in sibling modules.
 * Traffic workbook drift: `ui-route-traffic-architecture-scorecard.test.ts`.
 * Empty CTA + sample mode UI: `ReviewScorecardEmptyState.test.tsx`, `PilotScorecardPageView.test.tsx`.
 */
describe("architecture-scorecard Insights regressions (TB-1960)", () => {
  it("traffic workbook path matches canonical Insights route (TB-1956)", () => {
    expect(ARCHITECTURE_SCORECARD_TRAFFIC_PATH).toBe(SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH);
  });

  it("sample href uses canonical path with sample query (TB-1957)", () => {
    expect(REVIEW_SCORECARD_SAMPLE_HREF).toBe(`${SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH}?sample=1`);
  });

  it("contextual help maps architecture scorecard label to the page (TB-1959)", () => {
    const topic = pageHelpTopicForPathname(SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH);

    expect(topic?.slug).toBe("executive-summary");
    expect(topic?.hashFragment).toBe("pilot-roi-measurement");
    expect(topic?.label).toBe("Architecture scorecard");
  });

  it("empty primary CTA uses buyer Start architecture review label (TB-1958)", () => {
    expect(REVIEW_SCORECARD_EMPTY_PRIMARY_CTA).toBe(BUYER_START_ARCHITECTURE_REVIEW_CTA);
    expect(REVIEW_SCORECARD_EMPTY_PRIMARY_CTA).not.toBe("Create review");
  });
});
