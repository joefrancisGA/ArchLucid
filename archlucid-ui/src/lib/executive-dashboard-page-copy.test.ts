import { describe, expect, it } from "vitest";

import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
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

  it("uses sponsor-safe executive dashboard lead without env gating (TB-1533)", () => {
    expect(executiveDashboardPageSubtitle()).toBe(EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_BUYER);
    expect(EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_BUYER.length).toBeLessThan(
      EXECUTIVE_DASHBOARD_PAGE_SUBTITLE_OPERATOR.length,
    );
  });
});
