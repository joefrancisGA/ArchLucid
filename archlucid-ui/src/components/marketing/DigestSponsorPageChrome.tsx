import type { ReactNode } from "react";

import { DigestSponsorEvidenceOrientationStrip } from "@/components/marketing/DigestSponsorEvidenceOrientationStrip";
import { PageHeaderClaimDiscipline } from "@/components/operator/page-header-claim-discipline";
import { cn } from "@/lib/utils";
import { DIGEST_SPONSOR_CLAIM_DISCIPLINE } from "@/lib/marketing/digest-sponsor-evidence-copy";
import {
  DIGEST_SPONSOR_FIRST_VIEWPORT_ID,
  DIGEST_SPONSOR_PRIMARY_CONTENT_ID,
  DIGEST_SPONSOR_SKIP_LINK_LABEL,
  DIGEST_SPONSOR_SKIP_TARGET_ID,
} from "@/lib/marketing/digest-sponsor-page-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

type DigestSponsorPageChromeProps = {
  readonly hero: ReactNode;
  readonly children: ReactNode;
};

/** Shared marketing chrome for `/digest/sponsor` and run collateral (DIS, DIU). */
export function DigestSponsorPageChrome(props: DigestSponsorPageChromeProps): React.JSX.Element {
  const { hero, children } = props;

  return (
    <>
      <a href={`#${DIGEST_SPONSOR_SKIP_TARGET_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {DIGEST_SPONSOR_SKIP_LINK_LABEL}
      </a>

      <div
        id={DIGEST_SPONSOR_PRIMARY_CONTENT_ID}
        data-testid="digest-sponsor-primary-content"
        className={cn("scroll-mt-24 space-y-6 py-10")}
      >
        {hero}

        <div
          id={DIGEST_SPONSOR_FIRST_VIEWPORT_ID}
          data-testid={DIGEST_SPONSOR_FIRST_VIEWPORT_ID}
          className={cn(
            "scroll-mt-24 space-y-12 border-b border-neutral-200 pb-6 dark:border-neutral-800",
          )}
        >
          <div data-testid="digest-sponsor-orientation-top">
            <PageHeaderClaimDiscipline
              text={DIGEST_SPONSOR_CLAIM_DISCIPLINE}
              testId="digest-sponsor-claim-discipline"
              className="max-w-prose text-left"
            />
            <DigestSponsorEvidenceOrientationStrip />
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
