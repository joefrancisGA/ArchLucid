import { describe, expect, it } from "vitest";

import { BUYER_VALUE_REPORT_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { ROUTE_TITLES } from "@/lib/route-static-titles";
import {
  EXECUTIVE_SUMMARY_PAGE_TITLE,
  SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
  SPONSOR_REPORT_SECTION_LABEL,
} from "@/lib/sponsor-report-navigation";
import { VALUE_REPORT_OUTCOMES_TABS } from "@/lib/value-report-outcomes-nav-tabs";

describe("sponsor-report executive summary vocabulary (TB-1962)", () => {
  it("aligns metadata title, tab label, and route static title with page H1", () => {
    const executiveTab = VALUE_REPORT_OUTCOMES_TABS.find(
      (tab) => tab.href === SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
    );

    expect(EXECUTIVE_SUMMARY_PAGE_TITLE).toBe(BUYER_VALUE_REPORT_PAGE_TITLE);
    expect(EXECUTIVE_SUMMARY_PAGE_TITLE).toBe("Executive value report");
    expect(executiveTab?.label).toBe(EXECUTIVE_SUMMARY_PAGE_TITLE);
    expect(ROUTE_TITLES[SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH]).toBe(EXECUTIVE_SUMMARY_PAGE_TITLE);
    expect(`${EXECUTIVE_SUMMARY_PAGE_TITLE} | ${SPONSOR_REPORT_SECTION_LABEL}`).toBe(
      "Executive value report | Sponsor report",
    );
    expect(EXECUTIVE_SUMMARY_PAGE_TITLE.toLowerCase()).not.toBe("executive summary");
  });
});
