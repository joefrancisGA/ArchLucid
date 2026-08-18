"use client";

import { RoleMappingSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/** Buyer default: mount Sources orientation above the role-mapping workspace body (ADO). */
export function IdentityProvidersRoleMappingBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="identity-providers-role-mapping-orientation-top">
      <RoleMappingSettingsEvidenceOrientationStrip />
    </div>
  );
}
