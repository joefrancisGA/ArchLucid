import { describe, expect, it } from "vitest";

import { SPONSOR_REPORT_PAGE_TITLE as BUYER_SPONSOR_REPORT_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { ROUTE_TITLES } from "@/lib/route-static-titles";
import {
  SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
  SPONSOR_REPORT_PAGE_TITLE,
  SPONSOR_REPORT_SECTION_LABEL,
} from "@/lib/sponsor-report-navigation";
import { VALUE_REPORT_OUTCOMES_TABS } from "@/lib/value-report-outcomes-nav-tabs";

describe("sponsor-report executive summary vocabulary (TB-1962)", () => {
  it("aligns metadata title, tab label, and route static title with page H1", () => {
    const sponsorTab = VALUE_REPORT_OUTCOMES_TABS.find(
      (tab) => tab.href === SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
    );

    expect(SPONSOR_REPORT_PAGE_TITLE).toBe(BUYER_SPONSOR_REPORT_PAGE_TITLE);
    expect(SPONSOR_REPORT_PAGE_TITLE).toBe("Sponsor report");
    expect(sponsorTab?.label).toBe(SPONSOR_REPORT_PAGE_TITLE);
    expect(ROUTE_TITLES[SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH]).toBe(SPONSOR_REPORT_PAGE_TITLE);
    expect(`${SPONSOR_REPORT_PAGE_TITLE} | ${SPONSOR_REPORT_SECTION_LABEL}`).toBe("Sponsor report | Insights");
    expect(SPONSOR_REPORT_PAGE_TITLE.toLowerCase()).not.toBe("executive summary");
  });

  it("keeps the nav section label distinct from the page title so metadata never doubles", () => {
    expect(SPONSOR_REPORT_SECTION_LABEL).toBe("Insights");
    expect(SPONSOR_REPORT_SECTION_LABEL).not.toBe(SPONSOR_REPORT_PAGE_TITLE);
  });
});
