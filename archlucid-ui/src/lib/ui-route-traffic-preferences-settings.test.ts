import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  PREFERENCES_SETTINGS_TRAFFIC_NOTE,
  PREFERENCES_SETTINGS_TRAFFIC_PATH,
  PREFERENCES_SETTINGS_TRAFFIC_ROW_ID,
  PREFERENCES_SETTINGS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-preferences-settings";

describe("ui-route-traffic-preferences-settings (ADR)", () => {
  it("tracks Preferences settings with Settings Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, PREFERENCES_SETTINGS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(PREFERENCES_SETTINGS_TRAFFIC_PATH);
    expect(row?.section).toBe(PREFERENCES_SETTINGS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(PREFERENCES_SETTINGS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("PreferencesSettingsPageView");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
