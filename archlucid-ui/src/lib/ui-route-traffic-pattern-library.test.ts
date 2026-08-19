import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  PATTERN_LIBRARY_TRAFFIC_NOTE,
  PATTERN_LIBRARY_TRAFFIC_PATH,
  PATTERN_LIBRARY_TRAFFIC_ROW_ID,
  PATTERN_LIBRARY_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-pattern-library";

describe("ui-route-traffic-pattern-library (INP)", () => {
  it("tracks patterns hub with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === PATTERN_LIBRARY_TRAFFIC_ROW_ID);
    const pxx = rows.find((candidate) => candidate.id === "PXX");

    expect(pxx).toBeUndefined();
    expect(row).toBeDefined();
    expect(row?.path).toBe(PATTERN_LIBRARY_TRAFFIC_PATH);
    expect(row?.section).toBe(PATTERN_LIBRARY_TRAFFIC_SECTION);
    expect(row?.notes).toBe(PATTERN_LIBRARY_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);

    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
