"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { TenantSettingsSettingsClaimOrientationStrip } from "./TenantSettingsSettingsClaimOrientationStrip";

/** Buyer default: mount Sources follow-ups after primary workspace settings (ATE). */
export function TenantSettingsSettingsBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="tenant-settings-orientation-bottom">
      <TenantSettingsSettingsClaimOrientationStrip />
    </div>
  );
}
