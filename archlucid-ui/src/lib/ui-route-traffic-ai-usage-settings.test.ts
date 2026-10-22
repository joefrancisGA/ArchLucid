import { describe, expect, it } from "vitest";

import {
  extractMasterTableRows,
  findTrafficRowById,
  readUiRouteTrafficEstimatesTemplateMarkdown,
} from "@/lib/testing/ui-route-traffic-workbook-test-utils";
import { REMOVED_REDIRECT_SHIM_TRAFFIC_ROW_IDS } from "@/lib/ui-route-traffic-retired-redirect-shims";

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

  it("does not track retired AAX workbook row independently (TB-1406 / TB-1404)", () => {
    expect(REMOVED_REDIRECT_SHIM_TRAFFIC_ROW_IDS).toContain("AAX");

    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());

    expect(rows.find((row) => row.id === "AAX")).toBeUndefined();
    expect(rows.find((row) => row.path === "/admin/ai-usage-cost")).toBeUndefined();
  });
});
