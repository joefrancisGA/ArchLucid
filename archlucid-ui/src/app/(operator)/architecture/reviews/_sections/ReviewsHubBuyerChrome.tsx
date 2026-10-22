"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { ReviewsHubClaimOrientationStrip } from "./ReviewsHubClaimOrientationStrip";

/** Buyer default: mount Sources orientation above review inventory inside first viewport (RE). */
export function ReviewsHubBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="reviews-hub-orientation-top">
      <ReviewsHubClaimOrientationStrip />
    </div>
  );
}
