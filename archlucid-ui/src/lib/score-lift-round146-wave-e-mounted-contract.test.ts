import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score lift round146 wave E mounted contract", () => {
  it("quote packet meter footnote, billing comparison, pilot CTA, first-hour marketing band", () => {
    const quote = readUiSource("app/(operator)/administration/securenow-quote-packet/SecureNowQuotePacketPageView.tsx");
    expect(quote).toContain("SecureNowQuotePacketMeterTableFootnote");

    const billing = readUiSource("app/(operator)/administration/billing/OperatorBillingPlansClient.tsx");
    expect(billing).toContain("SecureNowArchLucidBillingComparisonStrip");

    const pilot = readUiSource("app/(operator)/administration/securenow-pilot-decision/SecureNowPilotDecisionPageView.tsx");
    expect(pilot).toContain("SecureNowPilotDecisionInProgressCtaStrip");

    const firstHour = readUiSource("app/(operator)/administration/securenow-first-hour/SecureNowFirstHourPageView.tsx");
    expect(firstHour).toContain("SecureNowFirstHourMarketingSkuBand");

    const blocked = readUiSource("components/product-line/ProductLineRouteBlockedView.tsx");
    expect(blocked).toContain("resolveProductLineRouteBlockedEntitlementEmptyLine");
  });
});
