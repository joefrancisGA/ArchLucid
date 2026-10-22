"use client";

import { ModelGovernanceSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources orientation above the AI models workspace body (AMO). */
export function ModelGovernanceSettingsBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="model-governance-settings-orientation-top">
      <ModelGovernanceSettingsEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
    </div>
  );
}
