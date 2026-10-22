import type { ReactNode } from "react";

import { PricingEvidenceOrientationStrip } from "@/components/marketing/PricingEvidenceOrientationStrip";
import { PricingPageHero } from "@/components/marketing/PricingPageHero";
import {
  PRICING_PRIMARY_CONTENT_ID,
  PRICING_SKIP_LINK_LABEL,
} from "@/lib/marketing/pricing-page-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

type PricingPageChromeProps = {
  readonly children: ReactNode;
};

/** Shared marketing chrome for `/pricing` — skip link, hero, evaluation Sources, primary body. */
export function PricingPageChrome(props: PricingPageChromeProps): React.JSX.Element {
  const { children } = props;

  return (
    <>
      <a href={`#${PRICING_PRIMARY_CONTENT_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {PRICING_SKIP_LINK_LABEL}
      </a>

      <PricingPageHero />

      <div data-testid="pricing-orientation-top">
        <PricingEvidenceOrientationStrip placement="top" />
      </div>

      <div id={PRICING_PRIMARY_CONTENT_ID} data-testid="pricing-primary-content" className="scroll-mt-24 space-y-4">
        {children}
      </div>
    </>
  );
}
