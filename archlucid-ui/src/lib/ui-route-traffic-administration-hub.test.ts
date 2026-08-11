import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ADMINISTRATION_HUB_TRAFFIC_NOTE,
  ADMINISTRATION_HUB_TRAFFIC_PATH,
  ADMINISTRATION_HUB_TRAFFIC_ROW_ID,
  ADMINISTRATION_HUB_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-administration-hub";

describe("ui-route-traffic-administration-hub (SET)", () => {
  it("tracks Settings hub under Admin with configuration launcher Evidence notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === ADMINISTRATION_HUB_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ADMINISTRATION_HUB_TRAFFIC_PATH);
    expect(row?.section).toBe(ADMINISTRATION_HUB_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ADMINISTRATION_HUB_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
