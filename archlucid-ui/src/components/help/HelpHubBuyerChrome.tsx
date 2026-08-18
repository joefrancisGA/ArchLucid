"use client";

import type { ReactNode } from "react";

import {
  HELP_HUB_PRIMARY_CONTENT_ID,
  HELP_HUB_SKIP_LINK_LABEL,
} from "@/lib/help/help-hub-page-copy";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

import { HelpHubBreadcrumb } from "./HelpHubBreadcrumb";
import { HelpHubClaimOrientationStrip } from "./HelpHubClaimOrientationStrip";

type HelpHubBuyerChromeProps = {
  readonly hero: ReactNode;
  readonly children: ReactNode;
};

/** Shared buyer-facing chrome for `/help` — skip link, breadcrumb, claim/Sources, guide body. */
export function HelpHubBuyerChrome({ hero, children }: HelpHubBuyerChromeProps): React.JSX.Element {
  return (
    <>
      <a href={`#${HELP_HUB_PRIMARY_CONTENT_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        {HELP_HUB_SKIP_LINK_LABEL}
      </a>

      <div className="mb-4 text-left">
        <HelpHubBreadcrumb />
      </div>

      {hero}

      <div className="mb-6 text-left" data-testid="help-hub-orientation-top">
        <HelpHubClaimOrientationStrip />
      </div>

      <div
        id={HELP_HUB_PRIMARY_CONTENT_ID}
        data-testid="help-hub-primary-content"
        className="scroll-mt-24 space-y-6"
      >
        {children}
      </div>
    </>
  );
}
