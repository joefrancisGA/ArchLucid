import type { ReactNode } from "react";

import { SeeItEvidenceOrientationStrip } from "@/components/marketing/SeeItEvidenceOrientationStrip";
import { SeeItScopeDisclosure } from "@/components/marketing/see-it/SeeItScopeDisclosure";
import { TrustCenterRevisionHistory } from "@/components/marketing/trust-center/TrustCenterRevisionHistory";
import { SEE_IT_REVISION_HISTORY } from "@/lib/see-it-marketing-revision-history";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

import { SEE_IT_PRIMARY_CONTENT_ID } from "./see-it-page-content";
import { SeeItHeroSection } from "./SeeItHeroSection";

export type SeeItMarketingPageChromeProps = {
  readonly children: ReactNode;
};

/** Shared marketing chrome for `/see-it` — hero, scope boundary, revision log, Sources footer. */
export function SeeItMarketingPageChrome(props: SeeItMarketingPageChromeProps): React.JSX.Element {
  const { children } = props;

  return (
    <>
      <a href={`#${SEE_IT_PRIMARY_CONTENT_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        Skip to sample review content
      </a>

      <SeeItHeroSection />

      <div data-testid="see-it-orientation-top">
        <SeeItEvidenceOrientationStrip />
      </div>

      <SeeItScopeDisclosure />

      <div id={SEE_IT_PRIMARY_CONTENT_ID} className="scroll-mt-24 space-y-14">
        {children}
      </div>

      <TrustCenterRevisionHistory entries={SEE_IT_REVISION_HISTORY} />
    </>
  );
}

