import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SCIM_PROVISIONING_TRAFFIC_NOTE,
  SCIM_PROVISIONING_TRAFFIC_PATH,
  SCIM_PROVISIONING_TRAFFIC_ROW_ID,
  SCIM_PROVISIONING_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-scim-provisioning";

describe("ui-route-traffic-scim-provisioning (ASC)", () => {
  it("tracks SCIM provisioning under Settings with honest access-hub notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, SCIM_PROVISIONING_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SCIM_PROVISIONING_TRAFFIC_PATH);
    expect(row?.section).toBe(SCIM_PROVISIONING_TRAFFIC_SECTION);
    expect(row?.notes).toBe(SCIM_PROVISIONING_TRAFFIC_NOTE);
    expect(row?.notes).toContain("ScimProvisioningSettingsPageClient");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
