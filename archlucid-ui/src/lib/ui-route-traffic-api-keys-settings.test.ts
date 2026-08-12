import { describe, expect, it } from "vitest";

import { extractMasterTableRows, findTrafficRowById, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  API_KEYS_SETTINGS_TRAFFIC_NOTE,
  API_KEYS_SETTINGS_TRAFFIC_PATH,
  API_KEYS_SETTINGS_TRAFFIC_ROW_ID,
  API_KEYS_SETTINGS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-api-keys-settings";

describe("ui-route-traffic-api-keys-settings (ADP)", () => {
  it("tracks API keys settings with Admin Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, API_KEYS_SETTINGS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(API_KEYS_SETTINGS_TRAFFIC_PATH);
    expect(row?.section).toBe(API_KEYS_SETTINGS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(API_KEYS_SETTINGS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("ApiKeysSettingsPageClient");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
