import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  PRODUCT_LEARNING_TRAFFIC_NOTE,
  PRODUCT_LEARNING_TRAFFIC_PATH,
  PRODUCT_LEARNING_TRAFFIC_ROW_ID,
  PRODUCT_LEARNING_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-product-learning";

describe("ui-route-traffic-product-learning (INR)", () => {
  it("tracks Pilot feedback with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === PRODUCT_LEARNING_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(PRODUCT_LEARNING_TRAFFIC_PATH);
    expect(row?.section).toBe(PRODUCT_LEARNING_TRAFFIC_SECTION);
    expect(row?.notes).toBe(PRODUCT_LEARNING_TRAFFIC_NOTE);
    expect(row?.notes).toContain("ProductLearningPageView");
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);

    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
