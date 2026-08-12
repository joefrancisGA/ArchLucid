import { describe, expect, it } from "vitest";

import { extractMasterTableRows, findTrafficRowById, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ADVISORY_SCANS_SCHEDULES_TAB_TRAFFIC_NOTE,
  ADVISORY_SCANS_SCHEDULES_TAB_TRAFFIC_PATH,
  ADVISORY_SCANS_SCHEDULES_TAB_TRAFFIC_ROW_ID,
  ADVISORY_SCANS_SCHEDULES_TAB_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-advisory-scans-schedules-tab";

describe("ui-route-traffic-advisory-scans-schedules-tab (AD)", () => {
  it("tracks the canonical Schedules tab with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, ADVISORY_SCANS_SCHEDULES_TAB_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ADVISORY_SCANS_SCHEDULES_TAB_TRAFFIC_PATH);
    expect(row?.section).toBe(ADVISORY_SCANS_SCHEDULES_TAB_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ADVISORY_SCANS_SCHEDULES_TAB_TRAFFIC_NOTE);
    expect(row?.section.toLowerCase()).not.toBe("marketing");
    expect(row?.notes).toContain("AdvisorySchedulesContent");
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Sources");

    expect(row?.notes).toContain("TB-1124");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
