"use client";

import { ApprovalQueueSourcesOrientationStrip } from "./ApprovalQueueSourcesOrientationStrip";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/** Buyer default: mount Sources follow-ups after primary approval queue workspace (GOP). */
export function GovernanceApprovalQueueBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <ApprovalQueueSourcesOrientationStrip />;
}
