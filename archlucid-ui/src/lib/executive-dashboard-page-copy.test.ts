import { describe, expect, it } from "vitest";

import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import {
  EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_BUYER,
  EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_OPERATOR,
  EXECUTIVE_DASHBOARD_PAGE_TITLE,
  executiveDashboardPageSubtitle,
} from "@/lib/executive-dashboard-page-copy";

describe("executive-dashboard-page-copy", () => {
  it("uses product-safe executive dashboard naming", () => {
    expect(EXECUTIVE_DASHBOARD_PAGE_TITLE).toBe(BUYER_EXECUTIVE_SUMMARY_VOCABULARY.portfolioPageTitle);
    expect(EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_OPERATOR).toBe(BUYER_EXECUTIVE_SUMMARY_VOCABULARY.portfolioPageLead);
  });

  it("uses a shorter buyer subtitle", () => {
    expect(executiveDashboardPageSubtitle(true)).toBe(EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_BUYER);
    expect(executiveDashboardPageSubtitle(false)).toBe(EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_OPERATOR);
    expect(EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_BUYER.length).toBeLessThan(
      EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_OPERATOR.length,
    );
  });
});
