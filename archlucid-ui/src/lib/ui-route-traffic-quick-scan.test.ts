import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  QUICK_SCAN_TRAFFIC_NOTE,
  QUICK_SCAN_TRAFFIC_PATH,
  QUICK_SCAN_TRAFFIC_ROW_ID,
  QUICK_SCAN_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-quick-scan";

describe("ui-route-traffic-quick-scan (QXX)", () => {
  it("tracks Quick scan with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === QUICK_SCAN_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(QUICK_SCAN_TRAFFIC_PATH);
    expect(row?.section).toBe(QUICK_SCAN_TRAFFIC_SECTION);
    expect(row?.notes).toBe(QUICK_SCAN_TRAFFIC_NOTE);
    
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
