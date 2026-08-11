import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  COMPARE_TWO_REVIEWS_TRAFFIC_NOTE,
  COMPARE_TWO_REVIEWS_TRAFFIC_PATH,
  COMPARE_TWO_REVIEWS_TRAFFIC_ROW_ID,
  COMPARE_TWO_REVIEWS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-compare-two-reviews";

describe("ui-route-traffic-compare-two-reviews (CXX)", () => {
  it("tracks Compare two reviews with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === COMPARE_TWO_REVIEWS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(COMPARE_TWO_REVIEWS_TRAFFIC_PATH);
    expect(row?.section).toBe(COMPARE_TWO_REVIEWS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(COMPARE_TWO_REVIEWS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("CompareForm");
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Score 68");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
