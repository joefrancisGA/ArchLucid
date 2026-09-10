"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { SignedRecordsListClaimOrientationStrip } from "./SignedRecordsListClaimOrientationStrip";

/** Buyer default: mount Sources follow-ups after primary finalized-records workspace (SI). */
export function SignedRecordsListBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div className="mb-4 text-left" data-testid="signed-records-list-orientation-bottom">
      <SignedRecordsListClaimOrientationStrip />
    </div>
  );
}
