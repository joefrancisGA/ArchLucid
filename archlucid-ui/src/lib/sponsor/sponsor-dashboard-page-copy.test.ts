import { describe, expect, it } from "vitest";

import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import {
  SPONSOR_DASHBOARD_PAGE_SUBTITLE_BUYER,
  SPONSOR_DASHBOARD_PAGE_SUBTITLE_OPERATOR,
  SPONSOR_DASHBOARD_PAGE_TITLE,
  executiveDashboardPageSubtitle,
} from "@/lib/sponsor/sponsor-dashboard-page-copy";

describe("sponsor-dashboard-page-copy", () => {
  it("uses product-safe sponsor dashboard naming", () => {
    expect(SPONSOR_DASHBOARD_PAGE_TITLE).toBe(BUYER_SPONSOR_SUMMARY_VOCABULARY.portfolioPageTitle);
    expect(SPONSOR_DASHBOARD_PAGE_SUBTITLE_OPERATOR).toBe(BUYER_SPONSOR_SUMMARY_VOCABULARY.portfolioPageLead);
  });

  it("uses sponsor-safe sponsor dashboard lead without env gating (TB-1533)", () => {
    expect(executiveDashboardPageSubtitle()).toBe(SPONSOR_DASHBOARD_PAGE_SUBTITLE_BUYER);
    expect(SPONSOR_DASHBOARD_PAGE_SUBTITLE_BUYER).toBe(BUYER_SPONSOR_SUMMARY_VOCABULARY.portfolioPageLead);
  });
});
