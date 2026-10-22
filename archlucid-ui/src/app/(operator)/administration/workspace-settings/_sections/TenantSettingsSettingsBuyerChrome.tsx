"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { TenantSettingsSourcesOrientationStrip } from "./TenantSettingsSourcesOrientationStrip";

/** Buyer default: mount Sources follow-ups after primary workspace settings (ATE). */
export function TenantSettingsSettingsBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <TenantSettingsSourcesOrientationStrip />;
}
