import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ALERT_RULES_COMPOSITE_TAB_TRAFFIC_NOTE,
  ALERT_RULES_COMPOSITE_TAB_TRAFFIC_PATH,
  ALERT_RULES_COMPOSITE_TAB_TRAFFIC_ROW_ID,
  ALERT_RULES_COMPOSITE_TAB_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-alert-rules-composite-tab";

describe("ui-route-traffic-alert-rules-composite-tab (GOC)", () => {
  it("tracks the Advanced/composite tab under Tab surface with inherited SAX Evidence notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === ALERT_RULES_COMPOSITE_TAB_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ALERT_RULES_COMPOSITE_TAB_TRAFFIC_PATH);
    expect(row?.section).toBe(ALERT_RULES_COMPOSITE_TAB_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ALERT_RULES_COMPOSITE_TAB_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);

    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
