import { describe, expect, it } from "vitest";

import {
  extractMasterTableRows,
  findTrafficRowById,
  readUiRouteTrafficEstimatesTemplateMarkdown,
} from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SPONSOR_SUMMARY_HELP_TRAFFIC_NOTE,
  SPONSOR_SUMMARY_HELP_TRAFFIC_PATH,
  SPONSOR_SUMMARY_HELP_TRAFFIC_ROW_ID,
  SPONSOR_SUMMARY_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-sponsor-report-help";

describe("ui-route-traffic-sponsor-report-help (EXE)", () => {
  it("tracks the canonical sponsor report help topic with specialty-guide workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, SPONSOR_SUMMARY_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SPONSOR_SUMMARY_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(SPONSOR_SUMMARY_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(SPONSOR_SUMMARY_HELP_TRAFFIC_NOTE);
    expect(row?.section.toLowerCase()).not.toBe("marketing");
    expect(row?.notes).toContain("HelpSponsorReportGuideView");
    expect(row?.notes).toContain("Score 58");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
