import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  REVIEWS_HUB_TRAFFIC_NOTE,
  REVIEWS_HUB_TRAFFIC_PATH,
  REVIEWS_HUB_TRAFFIC_ROW_ID,
  REVIEWS_HUB_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-reviews-hub";

describe("ui-route-traffic-reviews-hub (RE)", () => {
  it("tracks Architecture reviews hub under Core review with inventory launcher Evidence notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === REVIEWS_HUB_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(REVIEWS_HUB_TRAFFIC_PATH);
    expect(row?.section).toBe(REVIEWS_HUB_TRAFFIC_SECTION);
    expect(row?.notes).toBe(REVIEWS_HUB_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
