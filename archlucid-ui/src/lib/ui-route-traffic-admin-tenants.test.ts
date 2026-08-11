import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ADMIN_TENANTS_TRAFFIC_NOTE,
  ADMIN_TENANTS_TRAFFIC_PATH,
  ADMIN_TENANTS_TRAFFIC_ROW_ID,
  ADMIN_TENANTS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-admin-tenants";

describe("ui-route-traffic-admin-tenants (INT)", () => {
  it("tracks Admin tenants with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === ADMIN_TENANTS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ADMIN_TENANTS_TRAFFIC_PATH);
    expect(row?.section).toBe(ADMIN_TENANTS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ADMIN_TENANTS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("AdminTenantsPageClient");
    expect(row?.notes).toContain("Sources");

    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
