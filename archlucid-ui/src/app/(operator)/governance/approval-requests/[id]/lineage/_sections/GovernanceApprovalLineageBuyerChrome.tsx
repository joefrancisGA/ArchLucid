"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

import { GovernanceApprovalLineageClaimOrientationStrip } from "./GovernanceApprovalLineageClaimOrientationStrip";

/** Buyer default: mount Sources follow-ups after primary approval lineage body (GAI). */
export function GovernanceApprovalLineageBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div
      data-testid="approval-lineage-orientation-bottom"
      className={HELP_PAGE_LAYOUT.readingBody}
    >
      <GovernanceApprovalLineageClaimOrientationStrip />
    </div>
  );
}
