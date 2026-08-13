import { describe, expect, it } from "vitest";

import {
  extractMasterTableRows,
  findTrafficRowById,
  readUiRouteTrafficEstimatesTemplateMarkdown,
} from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ALERT_RULES_ROUTING_TAB_TRAFFIC_NOTE,
  ALERT_RULES_ROUTING_TAB_TRAFFIC_PATH,
  ALERT_RULES_ROUTING_TAB_TRAFFIC_ROW_ID,
  ALERT_RULES_ROUTING_TAB_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-alert-rules-routing-tab";

describe("ui-route-traffic-alert-rules-routing-tab (ALE)", () => {
  it("tracks Notifications/routing tab Notes on the ALE workbook row", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, ALERT_RULES_ROUTING_TAB_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ALERT_RULES_ROUTING_TAB_TRAFFIC_PATH);
    expect(row?.section).toBe(ALERT_RULES_ROUTING_TAB_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ALERT_RULES_ROUTING_TAB_TRAFFIC_NOTE);
    expect(row?.notes).toContain("AlertRoutingContent");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
