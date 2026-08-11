import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  DEVELOPER_SETTINGS_CUSTOMER_SHELL_REDIRECT_PATH,
  DEVELOPER_SETTINGS_TRAFFIC_LEGACY_ROW_ID,
  DEVELOPER_SETTINGS_TRAFFIC_MONTHLY_SHARE,
  DEVELOPER_SETTINGS_TRAFFIC_NOTE,
  DEVELOPER_SETTINGS_TRAFFIC_PATH,
  DEVELOPER_SETTINGS_TRAFFIC_ROW_ID,
  DEVELOPER_SETTINGS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-developer-settings";

describe("ui-route-traffic-developer-settings (SDX / SED)", () => {
  it("tracks Internal developer tools as internal-gated with zero buyer traffic weight", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, DEVELOPER_SETTINGS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(DEVELOPER_SETTINGS_TRAFFIC_PATH);
    expect(row?.monthlyShare).toBe(DEVELOPER_SETTINGS_TRAFFIC_MONTHLY_SHARE);
    expect(row?.section).toBe(DEVELOPER_SETTINGS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(DEVELOPER_SETTINGS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("legacy owner SED");
    expect(row?.notes).toContain(DEVELOPER_SETTINGS_CUSTOMER_SHELL_REDIRECT_PATH);
    expect(row?.notes).toContain("never scored as buyer Settings hub");
    expect(row?.notes).toContain("DeveloperSettingsPageClient");
    expect(DEVELOPER_SETTINGS_TRAFFIC_LEGACY_ROW_ID).toBe("SED");
  });
});
