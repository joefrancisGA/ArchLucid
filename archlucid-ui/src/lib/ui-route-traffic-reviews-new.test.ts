import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  REVIEWS_NEW_TRAFFIC_NOTE,
  REVIEWS_NEW_TRAFFIC_PATH,
  REVIEWS_NEW_TRAFFIC_ROW_ID,
  REVIEWS_NEW_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-reviews-new";

describe("ui-route-traffic-reviews-new (RNX)", () => {
  it("tracks Start review intake with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === REVIEWS_NEW_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(REVIEWS_NEW_TRAFFIC_PATH);
    expect(row?.section).toBe(REVIEWS_NEW_TRAFFIC_SECTION);
    expect(row?.notes).toBe(REVIEWS_NEW_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Score 68");
    expect(row?.notes).toContain("cannot improve further toward 80");
    expect(row?.notes).toContain("ReviewsNewPageChrome");
  });
});
