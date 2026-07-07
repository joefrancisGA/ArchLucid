import type { Metadata } from "next";

import { PricingQuoteAgingPageClient } from "./_sections/PricingQuoteAgingPageClient";
import { loadPricingQuoteAgingPageData } from "./_sections/load-pricing-quote-aging-page-data";

export const metadata: Metadata = {
  title: "Pricing quote follow-up",
};

/** Internal sales-ops dashboard for marketing pricing quote request follow-up SLAs. */
export default async function PricingQuoteAgingPage() {
  const loaded = await loadPricingQuoteAgingPageData();

  return <PricingQuoteAgingPageClient loaded={loaded} />;
}
