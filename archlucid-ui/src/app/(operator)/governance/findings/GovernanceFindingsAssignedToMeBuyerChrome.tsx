"use client";

import { GovernanceAssignedToMeEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { GOVERNANCE_ASSIGNED_TO_ME_ORIENTATION_SOURCES } from "@/lib/governance/governance-assigned-to-me-evidence-copy";
import { governanceAssignedToMeOrientationSourcesForProductLine } from "@/lib/product-line/securenow-governance-assigned-to-me-evidence-copy";

/** Buyer default: mount Sources orientation after the assigned-to-me queue body (GOF). */
export function GovernanceFindingsAssignedToMeBuyerChrome(): React.JSX.Element | null {
  const { productLine } = useProductLine();

  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  const secureNowSources = governanceAssignedToMeOrientationSourcesForProductLine(productLine);
  const sources =
    secureNowSources.length > 0 ? secureNowSources : GOVERNANCE_ASSIGNED_TO_ME_ORIENTATION_SOURCES;

  return (
    <div data-testid="governance-assigned-to-me-orientation-bottom">
      <GovernanceAssignedToMeEvidenceOrientationStrip
        readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
        sources={sources}
      />
    </div>
  );
}
