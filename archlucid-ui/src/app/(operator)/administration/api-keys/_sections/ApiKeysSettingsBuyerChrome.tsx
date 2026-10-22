"use client";

import { ApiKeysSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources orientation above the API keys workspace body (ADP). */
export function ApiKeysSettingsBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="api-keys-settings-orientation-top">
      <ApiKeysSettingsEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
    </div>
  );
}
