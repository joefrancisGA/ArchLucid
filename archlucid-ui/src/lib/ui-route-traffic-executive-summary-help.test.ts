import { describe, expect, it } from "vitest";

import {
  extractMasterTableRows,
  findTrafficRowById,
  readUiRouteTrafficEstimatesTemplateMarkdown,
} from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  EXECUTIVE_SUMMARY_HELP_TRAFFIC_NOTE,
  EXECUTIVE_SUMMARY_HELP_TRAFFIC_PATH,
  EXECUTIVE_SUMMARY_HELP_TRAFFIC_ROW_ID,
  EXECUTIVE_SUMMARY_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-executive-summary-help";

describe("ui-route-traffic-executive-summary-help (EXE)", () => {
  it("tracks the canonical executive summary help topic with specialty-guide workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, EXECUTIVE_SUMMARY_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(EXECUTIVE_SUMMARY_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(EXECUTIVE_SUMMARY_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(EXECUTIVE_SUMMARY_HELP_TRAFFIC_NOTE);
    expect(row?.section.toLowerCase()).not.toBe("marketing");
    expect(row?.notes).toContain("HelpExecutiveSummaryGuideView");
    expect(row?.notes).toContain("Score 58");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
