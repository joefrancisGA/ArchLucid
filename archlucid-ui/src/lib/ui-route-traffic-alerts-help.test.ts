import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ALERTS_HELP_TRAFFIC_NOTE,
  ALERTS_HELP_TRAFFIC_PATH,
  ALERTS_HELP_TRAFFIC_ROW_ID,
  ALERTS_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-alerts-help";

describe("ui-route-traffic-alerts-help (HA)", () => {
  it("tracks Alerts help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === ALERTS_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ALERTS_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(ALERTS_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ALERTS_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpAlertsGuideView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
