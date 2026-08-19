import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  CANONICAL_ALERT_RULES_TRAFFIC_PATH,
  REMOVED_SETTINGS_ALERTS_TRAFFIC_ROW_ID,
  RETIRED_SETTINGS_ALERTS_TRAFFIC_PATH,
} from "@/lib/ui-route-traffic-legacy-settings-alerts";

describe("ui-route-traffic settings alerts retirement (TB-1886)", () => {
  it("does not track retired SEA; Alert rules hub stays on SAX", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const seaRow = rows.find((row) => row.id === REMOVED_SETTINGS_ALERTS_TRAFFIC_ROW_ID);
    const retiredPathRow = rows.find((row) => row.path === RETIRED_SETTINGS_ALERTS_TRAFFIC_PATH);
    const saxRow = rows.find((row) => row.path === CANONICAL_ALERT_RULES_TRAFFIC_PATH);

    expect(seaRow).toBeUndefined();
    expect(retiredPathRow).toBeUndefined();
    expect(saxRow).toBeDefined();
    expect(saxRow?.notes.toLowerCase()).not.toContain("/settings/alerts");
  });
});
