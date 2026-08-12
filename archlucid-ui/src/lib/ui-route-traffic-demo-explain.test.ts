import { describe, expect, it } from "vitest";

import {
  extractMasterTableRows,
  findTrafficRowById,
  readUiRouteTrafficEstimatesTemplateMarkdown,
} from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  DEMO_EXPLAIN_TRAFFIC_BUYER_SHELL_REDIRECT_PATH,
  DEMO_EXPLAIN_TRAFFIC_MONTHLY_SHARE,
  DEMO_EXPLAIN_TRAFFIC_NOTE,
  DEMO_EXPLAIN_TRAFFIC_PATH,
  DEMO_EXPLAIN_TRAFFIC_ROW_ID,
  DEMO_EXPLAIN_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-demo-explain";

describe("ui-route-traffic-demo-explain (DEX)", () => {
  it("tracks demo explain as internal-only with zero buyer traffic weight", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, DEMO_EXPLAIN_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(DEMO_EXPLAIN_TRAFFIC_PATH);
    expect(row?.hitPct).toBe(DEMO_EXPLAIN_TRAFFIC_MONTHLY_SHARE);
    expect(row?.section).toBe(DEMO_EXPLAIN_TRAFFIC_SECTION);
    expect(row?.notes).toBe(DEMO_EXPLAIN_TRAFFIC_NOTE);
    expect(row?.notes).toContain("TB-1322 IA-014");
    expect(row?.notes).toContain("never scored as buyer Learning traffic");
    expect(row?.notes).toContain(DEMO_EXPLAIN_TRAFFIC_BUYER_SHELL_REDIRECT_PATH);
    expect(row?.notes).toContain("DemoExplainPageView");
  });
});
