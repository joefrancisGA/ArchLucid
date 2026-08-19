import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SIGNED_RECORDS_LIST_TRAFFIC_NOTE,
  SIGNED_RECORDS_LIST_TRAFFIC_PATH,
  SIGNED_RECORDS_LIST_TRAFFIC_ROW_ID,
  SIGNED_RECORDS_LIST_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-signed-records-list";

describe("ui-route-traffic-signed-records-list (SI)", () => {
  it("tracks signed-records list hub with operator Alerts/gov section, not Marketing (TB-1941)", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === SIGNED_RECORDS_LIST_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SIGNED_RECORDS_LIST_TRAFFIC_PATH);
    expect(row?.section).toBe(SIGNED_RECORDS_LIST_TRAFFIC_SECTION);
    expect(row?.section).not.toBe("Marketing");
    expect(SIGNED_RECORDS_LIST_TRAFFIC_SECTION).toBe("Alerts/gov");
    expect(row?.notes).toBe(SIGNED_RECORDS_LIST_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);

    expect(rows.find((candidate) => candidate.id === "MA")).toBeUndefined();
  });
});
