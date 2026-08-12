import { describe, expect, it } from "vitest";

import { extractMasterTableRows, findTrafficRowById, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  ARCHITECTURES_NEW_TRAFFIC_NOTE,
  ARCHITECTURES_NEW_TRAFFIC_PATH,
  ARCHITECTURES_NEW_TRAFFIC_ROW_ID,
  ARCHITECTURES_NEW_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-architectures-new";

describe("ui-route-traffic-architectures-new (ANE)", () => {
  it("tracks Create architecture bootstrap with Core review Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, ARCHITECTURES_NEW_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ARCHITECTURES_NEW_TRAFFIC_PATH);
    expect(row?.section).toBe(ARCHITECTURES_NEW_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ARCHITECTURES_NEW_TRAFFIC_NOTE);
    expect(row?.notes).toContain("NewArchitecturePage");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
