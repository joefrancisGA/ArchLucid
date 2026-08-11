import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  MODEL_GOVERNANCE_SETTINGS_TRAFFIC_NOTE,
  MODEL_GOVERNANCE_SETTINGS_TRAFFIC_PATH,
  MODEL_GOVERNANCE_SETTINGS_TRAFFIC_ROW_ID,
  MODEL_GOVERNANCE_SETTINGS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-model-governance-settings";

describe("ui-route-traffic-model-governance-settings (AMO)", () => {
  it("tracks AI and model governance with Settings Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, MODEL_GOVERNANCE_SETTINGS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(MODEL_GOVERNANCE_SETTINGS_TRAFFIC_PATH);
    expect(row?.section).toBe(MODEL_GOVERNANCE_SETTINGS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(MODEL_GOVERNANCE_SETTINGS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("ModelGovernanceSettingsPage");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
