import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  REVIEWS_NEW_DETAILED_TAB_PATH_TOKEN,
  REVIEWS_NEW_DETAILED_TAB_PRODUCT_LABEL,
  REVIEWS_NEW_DETAILED_TAB_TRAFFIC_NOTE,
  REVIEWS_NEW_DETAILED_TAB_TRAFFIC_PATH,
  REVIEWS_NEW_DETAILED_TAB_TRAFFIC_ROW_ID,
  REVIEWS_NEW_DETAILED_TAB_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-reviews-new-detailed";

describe("ui-route-traffic-reviews-new-detailed (REN)", () => {
  it("tracks detailed path tab with honest workbook notes (TB-1866)", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === REVIEWS_NEW_DETAILED_TAB_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(REVIEWS_NEW_DETAILED_TAB_TRAFFIC_PATH);
    expect(row?.section).toBe(REVIEWS_NEW_DETAILED_TAB_TRAFFIC_SECTION);
    expect(row?.notes).toBe(REVIEWS_NEW_DETAILED_TAB_TRAFFIC_NOTE);
    expect(row?.notes).toContain(REVIEWS_NEW_DETAILED_TAB_PRODUCT_LABEL);
    expect(row?.notes).toContain(`path=${REVIEWS_NEW_DETAILED_TAB_PATH_TOKEN}`);
    expect(row?.notes).toContain("NewRunWizardClient");
    expect(row?.notes).toContain("Score 58");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
