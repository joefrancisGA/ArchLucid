import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ALERT_RULES_TRAFFIC_NOTE,
  ALERT_RULES_TRAFFIC_PATH,
  ALERT_RULES_TRAFFIC_ROW_ID,
  ALERT_RULES_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-alert-rules";

describe("ui-route-traffic-alert-rules (SAX)", () => {
  it("tracks Alert rules hub with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === ALERT_RULES_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ALERT_RULES_TRAFFIC_PATH);
    expect(row?.section).toBe(ALERT_RULES_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ALERT_RULES_TRAFFIC_NOTE);
    expect(row?.notes).toContain("AlertRulesHubClient");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
