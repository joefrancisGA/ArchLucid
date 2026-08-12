import { describe, expect, it } from "vitest";

import { extractMasterTableRows, findTrafficRowById, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  BASELINE_SETTINGS_TRAFFIC_NOTE,
  BASELINE_SETTINGS_TRAFFIC_PATH,
  BASELINE_SETTINGS_TRAFFIC_ROW_ID,
  BASELINE_SETTINGS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-baseline-settings";

describe("ui-route-traffic-baseline-settings (ADA)", () => {
  it("tracks Baseline settings with Settings Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, BASELINE_SETTINGS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(BASELINE_SETTINGS_TRAFFIC_PATH);
    expect(row?.section).toBe(BASELINE_SETTINGS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(BASELINE_SETTINGS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("BaselineSettingsClient");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
