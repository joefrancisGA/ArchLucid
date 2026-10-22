"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { AuthDomainsSettingsClaimOrientationStrip } from "./AuthDomainsSettingsClaimOrientationStrip";

/** Buyer default: mount Sources follow-ups after primary sign-in domains workspace (ADU). */
export function AuthDomainsSettingsBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="auth-domains-orientation-bottom">
      <AuthDomainsSettingsClaimOrientationStrip />
    </div>
  );
}
