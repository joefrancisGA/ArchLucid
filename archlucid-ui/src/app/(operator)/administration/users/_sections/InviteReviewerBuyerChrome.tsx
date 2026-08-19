"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { InviteReviewerClaimOrientationStrip } from "./InviteReviewerClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources on the invite-reviewer surface (SRI). */
export function InviteReviewerBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <InviteReviewerClaimOrientationStrip />;
}
