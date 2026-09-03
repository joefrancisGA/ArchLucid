"use client";

import { GovernanceAssignedToMeEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { GOVERNANCE_ASSIGNED_TO_ME_ORIENTATION_SOURCES } from "@/lib/governance/governance-assigned-to-me-evidence-copy";

/** Buyer default: mount Sources orientation after the assigned-to-me queue body (GOF). */
export function GovernanceFindingsAssignedToMeBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="governance-assigned-to-me-orientation-top">
      <GovernanceAssignedToMeEvidenceOrientationStrip
        readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
        sources={GOVERNANCE_ASSIGNED_TO_ME_ORIENTATION_SOURCES}
      />
    </div>
  );
}
