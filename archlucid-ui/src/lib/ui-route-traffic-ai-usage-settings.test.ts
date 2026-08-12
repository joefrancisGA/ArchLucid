import { describe, expect, it } from "vitest";

import { extractMasterTableRows, findTrafficRowById, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  AI_USAGE_SETTINGS_TRAFFIC_NOTE,
  AI_USAGE_SETTINGS_TRAFFIC_PATH,
  AI_USAGE_SETTINGS_TRAFFIC_ROW_ID,
  AI_USAGE_SETTINGS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-ai-usage-settings";

describe("ui-route-traffic-ai-usage-settings (ADI)", () => {
  it("tracks AI usage settings with Settings Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, AI_USAGE_SETTINGS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(AI_USAGE_SETTINGS_TRAFFIC_PATH);
    expect(row?.section).toBe(AI_USAGE_SETTINGS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(AI_USAGE_SETTINGS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("CostReportingSettingsPageView");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
