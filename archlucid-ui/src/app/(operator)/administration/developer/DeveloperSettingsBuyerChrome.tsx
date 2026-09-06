"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { DeveloperSettingsClaimOrientationStrip } from "./DeveloperSettingsClaimOrientationStrip";

/** Buyer default: mount Sources follow-ups after primary developer settings workspace (SDX). */
export function DeveloperSettingsBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="developer-settings-orientation-bottom">
      <DeveloperSettingsClaimOrientationStrip />
    </div>
  );
}
