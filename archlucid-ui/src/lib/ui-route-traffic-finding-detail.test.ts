import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  FINDING_DETAIL_TRAFFIC_NOTE,
  FINDING_DETAIL_TRAFFIC_PATH,
  FINDING_DETAIL_TRAFFIC_ROW_ID,
  FINDING_DETAIL_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-finding-detail";

describe("ui-route-traffic-finding-detail (RRF)", () => {
  it("tracks Finding detail under Core review with disposition Evidence notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === FINDING_DETAIL_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(FINDING_DETAIL_TRAFFIC_PATH);
    expect(row?.section).toBe(FINDING_DETAIL_TRAFFIC_SECTION);
    expect(row?.notes).toBe(FINDING_DETAIL_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
