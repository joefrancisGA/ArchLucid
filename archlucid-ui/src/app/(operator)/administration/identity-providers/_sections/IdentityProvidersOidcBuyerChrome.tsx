"use client";

import { IdentityProvidersOidcSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { IDENTITY_PROVIDERS_OIDC_ORIENTATION_SOURCES } from "@/lib/identity-providers-oidc-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources orientation above the OIDC status body (AOI). */
export function IdentityProvidersOidcBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="identity-providers-oidc-orientation-top">
      <IdentityProvidersOidcSettingsEvidenceOrientationStrip
        readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
        sources={IDENTITY_PROVIDERS_OIDC_ORIENTATION_SOURCES}
      />
    </div>
  );
}
