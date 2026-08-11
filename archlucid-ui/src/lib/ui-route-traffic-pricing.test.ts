import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  PRICING_TRAFFIC_NOTE,
  PRICING_TRAFFIC_PATH,
  PRICING_TRAFFIC_ROW_ID,
  PRICING_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-pricing";

describe("ui-route-traffic-pricing (P)", () => {
  it("tracks Pricing under Marketing with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === PRICING_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(PRICING_TRAFFIC_PATH);
    expect(row?.section).toBe(PRICING_TRAFFIC_SECTION);
    expect(row?.notes).toBe(PRICING_TRAFFIC_NOTE);
    expect(row?.notes).toContain("PricingEvidenceOrientationStrip");
    expect(row?.section).toBe("Marketing");
    expect(row?.notes).toContain("Score 58");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
