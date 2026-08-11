import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  DEMO_EXPLAIN_TRAFFIC_NOTE,
  DEMO_EXPLAIN_TRAFFIC_PATH,
  DEMO_EXPLAIN_TRAFFIC_ROW_ID,
  DEMO_EXPLAIN_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-demo-explain";

describe("ui-route-traffic-demo-explain (DEX)", () => {
  it("tracks demo explain with Learning Evidence workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, DEMO_EXPLAIN_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(DEMO_EXPLAIN_TRAFFIC_PATH);
    expect(row?.section).toBe(DEMO_EXPLAIN_TRAFFIC_SECTION);
    expect(row?.notes).toBe(DEMO_EXPLAIN_TRAFFIC_NOTE);
    expect(row?.notes).toContain("DemoExplainPageView");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
