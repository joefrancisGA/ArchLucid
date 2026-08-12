import { describe, expect, it } from "vitest";

import { extractMasterTableRows, findTrafficRowById, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ARCHITECTURES_LIST_TRAFFIC_NOTE,
  ARCHITECTURES_LIST_TRAFFIC_PATH,
  ARCHITECTURES_LIST_TRAFFIC_ROW_ID,
  ARCHITECTURES_LIST_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-architectures-list";

describe("ui-route-traffic-architectures-list (AR)", () => {
  it("tracks architectures list under Core review with honest Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, ARCHITECTURES_LIST_TRAFFIC_ROW_ID);
    const retiredAraRow = findTrafficRowById(rows, "ARA");

    expect(row).toBeDefined();
    expect(row?.id).toBe("AR");
    expect(row?.path).toBe(ARCHITECTURES_LIST_TRAFFIC_PATH);
    expect(row?.section).toBe(ARCHITECTURES_LIST_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ARCHITECTURES_LIST_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("cannot improve further toward 80");
    expect(retiredAraRow).toBeUndefined();
  });
});
