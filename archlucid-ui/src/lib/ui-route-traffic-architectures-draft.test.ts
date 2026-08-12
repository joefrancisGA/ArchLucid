import { describe, expect, it } from "vitest";

import { extractMasterTableRows, findTrafficRowById, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ARCHITECTURES_DRAFT_TRAFFIC_NOTE,
  ARCHITECTURES_DRAFT_TRAFFIC_PATH,
  ARCHITECTURES_DRAFT_TRAFFIC_ROW_ID,
  ARCHITECTURES_DRAFT_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-architectures-draft";

describe("ui-route-traffic-architectures-draft (ARR)", () => {
  it("tracks architecture draft detail under Core review with honest Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, ARCHITECTURES_DRAFT_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ARCHITECTURES_DRAFT_TRAFFIC_PATH);
    expect(row?.section).toBe(ARCHITECTURES_DRAFT_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ARCHITECTURES_DRAFT_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
