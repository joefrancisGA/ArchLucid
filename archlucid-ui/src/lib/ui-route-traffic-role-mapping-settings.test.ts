import { describe, expect, it } from "vitest";

import { extractMasterTableRows, findTrafficRowById, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ROLE_MAPPING_SETTINGS_TRAFFIC_NOTE,
  ROLE_MAPPING_SETTINGS_TRAFFIC_PATH,
  ROLE_MAPPING_SETTINGS_TRAFFIC_ROW_ID,
  ROLE_MAPPING_SETTINGS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-role-mapping-settings";

describe("ui-route-traffic-role-mapping-settings (ADO)", () => {
  it("tracks Role mapping settings with Settings Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, ROLE_MAPPING_SETTINGS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ROLE_MAPPING_SETTINGS_TRAFFIC_PATH);
    expect(row?.section).toBe(ROLE_MAPPING_SETTINGS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ROLE_MAPPING_SETTINGS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("IdentityProvidersRoleMappingPageView");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
