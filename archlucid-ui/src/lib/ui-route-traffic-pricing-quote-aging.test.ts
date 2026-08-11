import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  PRICING_QUOTE_AGING_TRAFFIC_NOTE,
  PRICING_QUOTE_AGING_TRAFFIC_PATH,
  PRICING_QUOTE_AGING_TRAFFIC_ROW_ID,
  PRICING_QUOTE_AGING_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-pricing-quote-aging";

describe("ui-route-traffic-pricing-quote-aging (APX)", () => {
  it("tracks Pricing quote follow-up with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === PRICING_QUOTE_AGING_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(PRICING_QUOTE_AGING_TRAFFIC_PATH);
    expect(row?.section).toBe(PRICING_QUOTE_AGING_TRAFFIC_SECTION);
    expect(row?.notes).toBe(PRICING_QUOTE_AGING_TRAFFIC_NOTE);
    expect(row?.notes).toContain("PricingQuoteAgingPageClient");
    expect(row?.notes).toContain("claim-discipline");

    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
