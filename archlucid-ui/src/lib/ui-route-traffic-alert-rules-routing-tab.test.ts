import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ALERT_RULES_ROUTING_TAB_TRAFFIC_NOTE,
  ALERT_RULES_ROUTING_TAB_TRAFFIC_PATH,
  ALERT_RULES_ROUTING_TAB_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-alert-rules-routing-tab";

describe("ui-route-traffic-alert-rules-routing-tab (GOR)", () => {
  it("tracks Notifications/routing tab Notes on the template path row", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.path === ALERT_RULES_ROUTING_TAB_TRAFFIC_PATH);

    expect(row).toBeDefined();
    expect(row?.section).toBe(ALERT_RULES_ROUTING_TAB_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ALERT_RULES_ROUTING_TAB_TRAFFIC_NOTE);
    expect(row?.notes).toContain("AlertRoutingContent");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
