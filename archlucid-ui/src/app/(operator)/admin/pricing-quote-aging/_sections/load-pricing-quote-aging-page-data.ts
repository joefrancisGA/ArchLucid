import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

export type PricingQuoteAgingPageServerLoad = {
  readonly demo: boolean;
};

export async function loadPricingQuoteAgingPageData(): Promise<PricingQuoteAgingPageServerLoad> {
  const demo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  return { demo };
}
