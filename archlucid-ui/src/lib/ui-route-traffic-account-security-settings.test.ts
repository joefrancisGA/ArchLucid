import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ACCOUNT_SECURITY_SETTINGS_TRAFFIC_NOTE,
  ACCOUNT_SECURITY_SETTINGS_TRAFFIC_PATH,
  ACCOUNT_SECURITY_SETTINGS_TRAFFIC_ROW_ID,
  ACCOUNT_SECURITY_SETTINGS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-account-security-settings";

describe("ui-route-traffic-account-security-settings (ADS)", () => {
  it("tracks Account security settings with Settings Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, ACCOUNT_SECURITY_SETTINGS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ACCOUNT_SECURITY_SETTINGS_TRAFFIC_PATH);
    expect(row?.section).toBe(ACCOUNT_SECURITY_SETTINGS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ACCOUNT_SECURITY_SETTINGS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("AccountSecurityPageClient");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
