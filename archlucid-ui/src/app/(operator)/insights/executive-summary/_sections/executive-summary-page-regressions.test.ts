import { describe, expect, it } from "vitest";

import { SPONSOR_REPORT_PAGE_TITLE as BUYER_SPONSOR_REPORT_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { COMMAND_PALETTE_ACTIONS } from "@/lib/command-palette-actions";
import {
  SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
  SPONSOR_REPORT_PAGE_TITLE,
} from "@/lib/sponsor-report-navigation";
import {
  TROUBLESHOOTING_DECISION_TREE_STEPS,
} from "@/lib/troubleshooting-help-guide-content";
import { EXECUTIVE_SUMMARY_TRAFFIC_PATH } from "@/lib/ui-route-traffic-executive-summary";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

/**
 * Bundle guard for TB-1961–TB-1964 (TB-1965): traffic workbook + vocabulary + canonical hrefs.
 * Chrome collapse: `ValueReportPageView.test.tsx` (TB-1964).
 * Workbook drift: `ui-route-traffic-executive-summary.test.ts` (TB-1961).
 */
describe("executive-summary sponsor-report regressions (TB-1965)", () => {
  it("traffic workbook path matches canonical sponsor-report route (TB-1961)", () => {
    expect(EXECUTIVE_SUMMARY_TRAFFIC_PATH).toBe(SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH);
  });

  it("page title vocabulary matches the merged sponsor report H1 (TB-1962)", () => {
    expect(SPONSOR_REPORT_PAGE_TITLE).toBe(BUYER_SPONSOR_REPORT_PAGE_TITLE);
    expect(SPONSOR_REPORT_PAGE_TITLE).toBe("Sponsor report");
  });

  it("command palette and troubleshooting open canonical SPE path (TB-1963)", () => {
    const valueReportAction = COMMAND_PALETTE_ACTIONS.find((action) => action.id === "action-export-value");
    const outputsStep = TROUBLESHOOTING_DECISION_TREE_STEPS.find((step) => step.id === "decision-outputs");
    const reportsBranch = outputsStep?.branches.find((branch) => branch.label === "Reports missing");

    expect(valueReportAction?.href).toBe(SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH);
    expect(reportsBranch?.href).toBe(SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH);
    expect(valueReportAction?.href).not.toBe("/value-report");
    expect(reportsBranch?.href).not.toBe("/value-report");
  });

  it("contextual help maps executive summary under sponsor-report", () => {
    expect(pageHelpTopicForPathname(SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH)?.slug).toBe("executive-summary");
  });
});
