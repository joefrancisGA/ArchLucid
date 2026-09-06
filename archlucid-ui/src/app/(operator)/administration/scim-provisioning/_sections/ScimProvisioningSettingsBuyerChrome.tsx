"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { ScimProvisioningSettingsClaimOrientationStrip } from "./ScimProvisioningSettingsClaimOrientationStrip";

/** Buyer default: mount Sources follow-ups after primary SCIM workspace (ASC). */
export function ScimProvisioningSettingsBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="scim-provisioning-orientation-bottom">
      <ScimProvisioningSettingsClaimOrientationStrip />
    </div>
  );
}
