import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  DEMO_ENTRY_TRAFFIC_NOTE,
  DEMO_ENTRY_TRAFFIC_PATH,
  DEMO_ENTRY_TRAFFIC_ROW_ID,
  DEMO_ENTRY_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-demo-entry";

describe("ui-route-traffic-demo-entry (DXX)", () => {
  it("documents retired /demo entry shim when master table row is absent", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === DEMO_ENTRY_TRAFFIC_ROW_ID);

    expect(row).toBeUndefined();
    expect(DEMO_ENTRY_TRAFFIC_PATH).toBe("/demo");
    expect(DEMO_ENTRY_TRAFFIC_SECTION).toBe("Marketing");
    expect(DEMO_ENTRY_TRAFFIC_NOTE).toContain("DemoEntryRedirect");
    expect(DEMO_ENTRY_TRAFFIC_NOTE).toContain("Sources");
    expect(DEMO_ENTRY_TRAFFIC_NOTE).toContain("cannot improve further toward 80");
  });
});
