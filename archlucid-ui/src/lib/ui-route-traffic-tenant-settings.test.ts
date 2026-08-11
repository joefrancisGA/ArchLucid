import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  TENANT_SETTINGS_TRAFFIC_NOTE,
  TENANT_SETTINGS_TRAFFIC_PATH,
  TENANT_SETTINGS_TRAFFIC_ROW_ID,
  TENANT_SETTINGS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-tenant-settings";

describe("ui-route-traffic-tenant-settings (ATE)", () => {
  it("tracks Tenant settings under Settings with honest access-hub notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, TENANT_SETTINGS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(TENANT_SETTINGS_TRAFFIC_PATH);
    expect(row?.section).toBe(TENANT_SETTINGS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(TENANT_SETTINGS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("TenantSettingsPageView");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
