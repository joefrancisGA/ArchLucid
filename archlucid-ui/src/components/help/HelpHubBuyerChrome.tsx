"use client";

import type { ReactNode } from "react";

import {
  HELP_HUB_PRIMARY_CONTENT_ID,
  HELP_HUB_SKIP_LINK_LABEL,
} from "@/lib/help/help-hub-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

import { HelpHubBreadcrumb } from "./HelpHubBreadcrumb";

type HelpHubBuyerChromeProps = {
  readonly hero: ReactNode;
  readonly children: ReactNode;
};

/** Shared buyer-facing chrome for `/help` — skip link, breadcrumb, header, primary guide body. */
export function HelpHubBuyerChrome({ hero, children }: HelpHubBuyerChromeProps): React.JSX.Element {
  return (
    <>
      <a href={`#${HELP_HUB_PRIMARY_CONTENT_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {HELP_HUB_SKIP_LINK_LABEL}
      </a>

      <div className="mb-4 text-left">
        <HelpHubBreadcrumb />
      </div>

      {hero}

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
