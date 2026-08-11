import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  TENANT_HEALTH_TRAFFIC_NOTE,
  TENANT_HEALTH_TRAFFIC_PATH,
  TENANT_HEALTH_TRAFFIC_ROW_ID,
  TENANT_HEALTH_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-tenant-health";

describe("ui-route-traffic-tenant-health (ATX)", () => {
  it("tracks Tenant health with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === TENANT_HEALTH_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(TENANT_HEALTH_TRAFFIC_PATH);
    expect(row?.section).toBe(TENANT_HEALTH_TRAFFIC_SECTION);
    expect(row?.notes).toBe(TENANT_HEALTH_TRAFFIC_NOTE);
    expect(row?.notes).toContain("TenantHealthAdminPageClient");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
