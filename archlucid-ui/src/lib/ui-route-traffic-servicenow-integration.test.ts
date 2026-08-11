import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SERVICENOW_INTEGRATION_TRAFFIC_NOTE,
  SERVICENOW_INTEGRATION_TRAFFIC_PATH,
  SERVICENOW_INTEGRATION_TRAFFIC_ROW_ID,
  SERVICENOW_INTEGRATION_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-servicenow-integration";

describe("ui-route-traffic-servicenow-integration (ISX)", () => {
  it("tracks ServiceNow integration with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === SERVICENOW_INTEGRATION_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SERVICENOW_INTEGRATION_TRAFFIC_PATH);
    expect(row?.section).toBe(SERVICENOW_INTEGRATION_TRAFFIC_SECTION);
    expect(row?.notes).toBe(SERVICENOW_INTEGRATION_TRAFFIC_NOTE);
    expect(row?.notes).toContain("ServiceNowIntegrationPageClient");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
