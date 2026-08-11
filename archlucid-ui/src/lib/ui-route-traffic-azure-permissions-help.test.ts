import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  AZURE_PERMISSIONS_HELP_TRAFFIC_NOTE,
  AZURE_PERMISSIONS_HELP_TRAFFIC_PATH,
  AZURE_PERMISSIONS_HELP_TRAFFIC_ROW_ID,
  AZURE_PERMISSIONS_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-azure-permissions-help";

describe("ui-route-traffic-azure-permissions-help (HE)", () => {
  it("tracks Azure permissions help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === AZURE_PERMISSIONS_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(AZURE_PERMISSIONS_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(AZURE_PERMISSIONS_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(AZURE_PERMISSIONS_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpAzurePermissionsGuideView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
