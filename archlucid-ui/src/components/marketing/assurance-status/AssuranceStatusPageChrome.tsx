import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { SecurityTrustEvidenceOrientationStrip } from "@/components/marketing/SecurityTrustEvidenceOrientationStrip";
import {
  ASSURANCE_STATUS_FIRST_VIEWPORT_ID,
  ASSURANCE_STATUS_PRIMARY_CONTENT_ID,
  ASSURANCE_STATUS_SKIP_LINK_LABEL,
  ASSURANCE_STATUS_SKIP_TARGET_ID,
} from "@/lib/marketing/assurance-status-page-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

type AssuranceStatusPageChromeProps = {
  readonly hero: ReactNode;
  readonly children: ReactNode;
};

/** Shared marketing chrome for `/assurance-status` — skip link, hero, and first-viewport workspace (SEC). */
export function AssuranceStatusPageChrome(props: AssuranceStatusPageChromeProps): React.JSX.Element {
  const { hero, children } = props;

  return (
    <>
      <a href={`#${ASSURANCE_STATUS_SKIP_TARGET_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {ASSURANCE_STATUS_SKIP_LINK_LABEL}
      </a>

      <div
        id={ASSURANCE_STATUS_PRIMARY_CONTENT_ID}
        data-testid="assurance-status-primary-content"
        className="scroll-mt-24 space-y-6"
      >
        {hero}

        <div
          id={ASSURANCE_STATUS_FIRST_VIEWPORT_ID}
          data-testid={ASSURANCE_STATUS_FIRST_VIEWPORT_ID}
          className={cn(
            "scroll-mt-24 space-y-12 border-b border-neutral-200 pb-6 dark:border-neutral-800",
          )}
        >
          <div data-testid="assurance-status-orientation-top">
            <SecurityTrustEvidenceOrientationStrip />
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
