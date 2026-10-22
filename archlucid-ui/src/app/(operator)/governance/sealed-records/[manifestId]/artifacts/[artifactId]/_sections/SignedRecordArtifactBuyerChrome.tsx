"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { SignedRecordArtifactClaimOrientationStrip } from "./SignedRecordArtifactClaimOrientationStrip";

/** Buyer default: mount Sources follow-ups after primary artifact preview body (GAR). */
export function SignedRecordArtifactBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div className="mb-4 text-left" data-testid="signed-record-artifact-orientation-bottom">
      <SignedRecordArtifactClaimOrientationStrip />
    </div>
  );
}
