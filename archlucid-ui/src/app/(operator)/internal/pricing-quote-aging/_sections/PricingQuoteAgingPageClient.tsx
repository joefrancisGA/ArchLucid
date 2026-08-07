"use client";

import type { PricingQuoteAgingPageServerLoad } from "./load-pricing-quote-aging-page-data";
import { PricingQuoteAgingPageView } from "./PricingQuoteAgingPageView";
import { usePricingQuoteAgingPage } from "./use-pricing-quote-aging-page";

type Props = {
  readonly loaded: PricingQuoteAgingPageServerLoad;
};

export function PricingQuoteAgingPageClient(props: Props) {
  const model = usePricingQuoteAgingPage(props.loaded);

  return <PricingQuoteAgingPageView model={model} />;
}
