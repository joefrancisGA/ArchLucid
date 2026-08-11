import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  REPORT_A_PROBLEM_HELP_TRAFFIC_NOTE,
  REPORT_A_PROBLEM_HELP_TRAFFIC_PATH,
  REPORT_A_PROBLEM_HELP_TRAFFIC_ROW_ID,
  REPORT_A_PROBLEM_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-report-a-problem-help";

describe("ui-route-traffic-report-a-problem-help (HRE)", () => {
  it("tracks Report a problem help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === REPORT_A_PROBLEM_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(REPORT_A_PROBLEM_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(REPORT_A_PROBLEM_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(REPORT_A_PROBLEM_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Score 58");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
