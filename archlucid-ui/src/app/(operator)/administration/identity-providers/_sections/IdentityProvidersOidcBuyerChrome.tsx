"use client";

import { IdentityProvidersOidcSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { IDENTITY_PROVIDERS_OIDC_ORIENTATION_SOURCES } from "@/lib/identity-providers-oidc-evidence-copy";

/** Buyer default: mount Sources orientation above the OIDC status body (AOI). */
export function IdentityProvidersOidcBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="identity-providers-oidc-orientation-top">
      <IdentityProvidersOidcSettingsEvidenceOrientationStrip
        sources={IDENTITY_PROVIDERS_OIDC_ORIENTATION_SOURCES}
      />
    </div>
  );
}
