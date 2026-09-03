"use client";

import { SettingsHubEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-settings-strips";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources orientation after primary workspace settings catalog (SET). */
export function SettingsMasterBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="settings-master-orientation-top">
      <SettingsHubEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
    </div>
  );
}
