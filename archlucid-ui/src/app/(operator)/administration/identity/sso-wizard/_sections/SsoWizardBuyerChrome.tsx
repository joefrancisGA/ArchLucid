"use client";

import { SsoWizardSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/** Buyer default: mount Sources orientation above the SSO wizard workflow (ASS). */
export function SsoWizardBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="sso-wizard-orientation-top">
      <SsoWizardSettingsEvidenceOrientationStrip />
    </div>
  );
}
