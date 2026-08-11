import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  HELP_HUB_TRAFFIC_NOTE,
  HELP_HUB_TRAFFIC_PATH,
  HELP_HUB_TRAFFIC_ROW_ID,
  HELP_HUB_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-help-hub";

describe("ui-route-traffic-help-hub (HEL)", () => {
  it("tracks Help Center hub under Help hub with orientation launcher Evidence notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === HELP_HUB_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(HELP_HUB_TRAFFIC_PATH);
    expect(row?.section).toBe(HELP_HUB_TRAFFIC_SECTION);
    expect(row?.notes).toBe(HELP_HUB_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
