import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  CANONICAL_ALERTS_INBOX_TRAFFIC_PATH,
  REMOVED_ALERTS_INBOX_TAB_TRAFFIC_ROW_ID,
  RETIRED_ALERTS_INBOX_TAB_TRAFFIC_PATH,
} from "@/lib/ui-route-traffic-alerts-inbox-tab";

describe("ui-route-traffic-alerts-inbox-tab (GOI removed)", () => {
  it("does not track retired GOI; inbox stays on AL", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const goiRow = rows.find((row) => row.id === REMOVED_ALERTS_INBOX_TAB_TRAFFIC_ROW_ID);
    const retiredPathRow = rows.find((row) => row.path === RETIRED_ALERTS_INBOX_TAB_TRAFFIC_PATH);
    const alRow = rows.find((row) => row.path === CANONICAL_ALERTS_INBOX_TRAFFIC_PATH);

    expect(goiRow).toBeUndefined();
    expect(retiredPathRow).toBeUndefined();
    expect(alRow).toBeDefined();
    expect(alRow?.notes.toLowerCase()).not.toContain("tab=inbox");
  });
});
