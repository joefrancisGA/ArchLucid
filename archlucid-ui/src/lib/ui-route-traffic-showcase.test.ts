import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SHOWCASE_TRAFFIC_NOTE,
  SHOWCASE_TRAFFIC_PATH,
  SHOWCASE_TRAFFIC_ROW_ID,
  SHOWCASE_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-showcase";

describe("ui-route-traffic-showcase (SRH)", () => {
  it("tracks Showcase with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === SHOWCASE_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SHOWCASE_TRAFFIC_PATH);
    expect(row?.section).toBe(SHOWCASE_TRAFFIC_SECTION);
    expect(row?.notes).toBe(SHOWCASE_TRAFFIC_NOTE);
    
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
