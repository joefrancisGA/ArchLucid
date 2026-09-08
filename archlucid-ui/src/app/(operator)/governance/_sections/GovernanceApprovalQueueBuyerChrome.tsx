"use client";

import { ApprovalQueueClaimOrientationStrip } from "./ApprovalQueueClaimOrientationStrip";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources follow-ups after primary approval queue workspace (GOP). */
export function GovernanceApprovalQueueBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="governance-approval-queue-orientation-bottom" className={HELP_PAGE_LAYOUT.readingBody}>
      <ApprovalQueueClaimOrientationStrip />
    </div>
  );
}
