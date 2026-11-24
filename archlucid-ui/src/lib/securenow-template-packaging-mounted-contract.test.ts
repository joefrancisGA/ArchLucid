import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { join } from "node:path";

function readUiSource(fragment: string): string {
  const fromUi = join(process.cwd(), "src", fragment);
  return readFileSync(fromUi, "utf8");
}

describe("securenow template and packaging mounted contract", () => {
  it("wires template card fixture, accelerator handoff, marketing SKU, and billing tier honesty", () => {
    const card = readUiSource("app/(operator)/help/_sections/SpecialtyTemplateCard.tsx");
    expect(card).toContain('data-testid="specialty-template-card-fixture-line"');
    const help = readUiSource("app/(operator)/help/_sections/HelpSpecialtyWalkthroughTemplatesClient.tsx");
    expect(help).toContain('data-testid="specialty-template-execute-denied"');
    const indexCopy = readUiSource("lib/product-line/securenow-pilot-spine-accelerator-index-copy.ts");
    expect(indexCopy).toContain("remediation-factory-empty");
    const why = readUiSource("app/(marketing)/why-securenow/WhySecureNowDraftView.tsx");
    expect(why).toContain("SecureNowBetaSkuContentsSection");
    const listPrice = readUiSource("components/product-line/SecureNowPublishedListPriceSection.tsx");
    expect(listPrice).toContain("securenow-list-price-commerce-limit");
    const billing = readUiSource("app/(operator)/administration/billing/OperatorBillingPlansClient.tsx");
    expect(billing).toContain("billing-tier-not-securenow-sku-");
    const pilot = readUiSource("app/(operator)/administration/securenow-pilot-decision/SecureNowPilotDecisionPageView.tsx");
    expect(pilot).toContain("securenow-pilot-decision-quote-packet-static");
  });
});
