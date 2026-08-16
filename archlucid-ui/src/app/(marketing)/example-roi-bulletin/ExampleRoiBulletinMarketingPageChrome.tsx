import type { ReactNode } from "react";

import { ExampleRoiBulletinEvidenceOrientationStrip } from "@/components/marketing/ExampleRoiBulletinEvidenceOrientationStrip";
import { ExampleRoiBulletinScopeDisclosure } from "@/components/marketing/example-roi-bulletin/ExampleRoiBulletinScopeDisclosure";
import { TrustCenterRevisionHistory } from "@/components/marketing/trust-center/TrustCenterRevisionHistory";
import { EXAMPLE_ROI_BULLETIN_REVISION_HISTORY } from "@/lib/example-roi-bulletin-marketing-revision-history";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

import { EXAMPLE_ROI_BULLETIN_PRIMARY_CONTENT_ID } from "./example-roi-bulletin-page-content";

export type ExampleRoiBulletinMarketingPageChromeProps = {
  readonly children: ReactNode;
};

/** Shared marketing chrome for `/example-roi-bulletin` — scope boundary, revision log, Sources footer. */
export function ExampleRoiBulletinMarketingPageChrome(
  props: ExampleRoiBulletinMarketingPageChromeProps,
): React.JSX.Element {
  const { children } = props;

  return (
    <>
      <a href={`#${EXAMPLE_ROI_BULLETIN_PRIMARY_CONTENT_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        Skip to sample bulletin
      </a>

      <ExampleRoiBulletinScopeDisclosure />

      <div id={EXAMPLE_ROI_BULLETIN_PRIMARY_CONTENT_ID} className="scroll-mt-24 space-y-14">
        {children}
      </div>

      <TrustCenterRevisionHistory entries={EXAMPLE_ROI_BULLETIN_REVISION_HISTORY} />

      <ExampleRoiBulletinEvidenceOrientationStrip />
    </>
  );
}
