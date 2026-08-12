import { describe, expect, it } from "vitest";

import { extractMasterTableRows, findTrafficRowById, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  IDENTITY_PROVIDERS_SETTINGS_TRAFFIC_NOTE,
  IDENTITY_PROVIDERS_SETTINGS_TRAFFIC_PATH,
  IDENTITY_PROVIDERS_SETTINGS_TRAFFIC_ROW_ID,
  IDENTITY_PROVIDERS_SETTINGS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-identity-providers-settings";

describe("ui-route-traffic-identity-providers-settings (AID)", () => {
  it("tracks SSO and identity hub with Settings Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, IDENTITY_PROVIDERS_SETTINGS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(IDENTITY_PROVIDERS_SETTINGS_TRAFFIC_PATH);
    expect(row?.section).toBe(IDENTITY_PROVIDERS_SETTINGS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(IDENTITY_PROVIDERS_SETTINGS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("IdentityProvidersSettingsPageView");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
