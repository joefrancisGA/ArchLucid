import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  RECURRENCE_SCHEDULES_TRAFFIC_NOTE,
  RECURRENCE_SCHEDULES_TRAFFIC_PATH,
  RECURRENCE_SCHEDULES_TRAFFIC_ROW_ID,
  RECURRENCE_SCHEDULES_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-recurrence-schedules";

describe("ui-route-traffic-recurrence-schedules (GRX)", () => {
  it("tracks Recurrence schedules under Alerts/gov with schedule config Evidence notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === RECURRENCE_SCHEDULES_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(RECURRENCE_SCHEDULES_TRAFFIC_PATH);
    expect(row?.section).toBe(RECURRENCE_SCHEDULES_TRAFFIC_SECTION);
    expect(row?.notes).toBe(RECURRENCE_SCHEDULES_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
