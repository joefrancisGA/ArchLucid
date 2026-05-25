import { PricingQuoteAgingPageClient } from "./_sections/PricingQuoteAgingPageClient";
import { loadPricingQuoteAgingPageData } from "./_sections/load-pricing-quote-aging-page-data";

/** Admin-only sales acknowledgement SLA dashboard for marketing pricing quote requests. */
export default async function PricingQuoteAgingPage() {
  const loaded = await loadPricingQuoteAgingPageData();

  return <PricingQuoteAgingPageClient loaded={loaded} />;
}
