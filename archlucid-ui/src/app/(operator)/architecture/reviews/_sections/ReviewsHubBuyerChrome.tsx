"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { ReviewsHubClaimOrientationStrip } from "./ReviewsHubClaimOrientationStrip";

/** Buyer default: mount Sources follow-ups after primary review inventory workspace. */
export function ReviewsHubBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <ReviewsHubClaimOrientationStrip />;
}
