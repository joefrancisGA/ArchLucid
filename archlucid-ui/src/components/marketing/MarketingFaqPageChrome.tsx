import type { ReactNode } from "react";

import { FaqEvidenceOrientationStrip } from "@/components/marketing/FaqEvidenceOrientationStrip";
import { PageHeaderClaimDiscipline } from "@/components/operator/page-header-claim-discipline";
import { cn } from "@/lib/utils";
import { FAQ_CLAIM_DISCIPLINE } from "@/lib/faq-evidence-copy";
import {
  MARKETING_FAQ_FIRST_VIEWPORT_ID,
  MARKETING_FAQ_PRIMARY_CONTENT_ID,
  MARKETING_FAQ_SKIP_LINK_LABEL,
  MARKETING_FAQ_SKIP_TARGET_ID,
} from "@/lib/marketing/marketing-faq-page-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

type MarketingFaqPageChromeProps = {
  readonly hero: ReactNode;
  readonly children: ReactNode;
};

/** Shared marketing chrome for `/faq` — skip link, hero, first-viewport orientation, FAQ body (FXX). */
export function MarketingFaqPageChrome(props: MarketingFaqPageChromeProps): React.JSX.Element {
  const { hero, children } = props;

  return (
    <>
      <a href={`#${MARKETING_FAQ_SKIP_TARGET_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {MARKETING_FAQ_SKIP_LINK_LABEL}
      </a>

      <div
        id={MARKETING_FAQ_PRIMARY_CONTENT_ID}
        data-testid="marketing-faq-primary-content"
        className="scroll-mt-24 space-y-6"
      >
        {hero}

        <div
          id={MARKETING_FAQ_FIRST_VIEWPORT_ID}
          data-testid={MARKETING_FAQ_FIRST_VIEWPORT_ID}
          className={cn(
            "scroll-mt-24 space-y-12 border-b border-neutral-200 pb-6 dark:border-neutral-800",
          )}
        >
          <div data-testid="faq-orientation-top">
            <PageHeaderClaimDiscipline
              text={FAQ_CLAIM_DISCIPLINE}
              testId="marketing-faq-claim-discipline"
              className="max-w-prose text-left"
            />
            <FaqEvidenceOrientationStrip />
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
