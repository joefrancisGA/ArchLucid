"use client";

import { IdentityProvidersSamlSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { IDENTITY_PROVIDERS_SAML_ORIENTATION_SOURCES } from "@/lib/identity-providers-saml-evidence-copy";

/** Buyer default: mount Sources orientation above the SAML configuration body (ASA). */
export function IdentityProvidersSamlBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="identity-providers-saml-orientation-top">
      <IdentityProvidersSamlSettingsEvidenceOrientationStrip
        readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
        sources={IDENTITY_PROVIDERS_SAML_ORIENTATION_SOURCES}
      />
    </div>
  );
}
