import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ADMIN_CONFIGURATION_TRAFFIC_NOTE,
  ADMIN_CONFIGURATION_TRAFFIC_PATH,
  ADMIN_CONFIGURATION_TRAFFIC_ROW_ID,
  ADMIN_CONFIGURATION_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-admin-configuration";

describe("ui-route-traffic-admin-configuration (ACX)", () => {
  it("tracks Configuration summary under Admin with effective-key Evidence notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === ADMIN_CONFIGURATION_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ADMIN_CONFIGURATION_TRAFFIC_PATH);
    expect(row?.section).toBe(ADMIN_CONFIGURATION_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ADMIN_CONFIGURATION_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
