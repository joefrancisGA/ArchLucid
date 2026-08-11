import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  CONNECTION_STATUS_TRAFFIC_NOTE,
  CONNECTION_STATUS_TRAFFIC_PATH,
  CONNECTION_STATUS_TRAFFIC_ROW_ID,
  CONNECTION_STATUS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-connection-status";

describe("ui-route-traffic-connection-status (ADC)", () => {
  it("tracks Connection status with Admin Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, CONNECTION_STATUS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(CONNECTION_STATUS_TRAFFIC_PATH);
    expect(row?.section).toBe(CONNECTION_STATUS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(CONNECTION_STATUS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("ConnectorOperationsDashboard");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
