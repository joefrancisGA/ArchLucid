import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ADMIN_HEALTH_TRAFFIC_NOTE,
  ADMIN_HEALTH_TRAFFIC_PATH,
  ADMIN_HEALTH_TRAFFIC_ROW_ID,
  ADMIN_HEALTH_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-admin-health";

describe("ui-route-traffic-admin-health (AHX)", () => {
  it("tracks Diagnostics dashboard under Admin with ops readiness Evidence notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === ADMIN_HEALTH_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ADMIN_HEALTH_TRAFFIC_PATH);
    expect(row?.section).toBe(ADMIN_HEALTH_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ADMIN_HEALTH_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
