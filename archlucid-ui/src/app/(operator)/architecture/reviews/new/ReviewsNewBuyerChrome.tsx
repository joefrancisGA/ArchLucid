"use client";

import { ReviewsNewEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { REVIEWS_NEW_ORIENTATION_SOURCES } from "@/lib/reviews-new-evidence-copy";

/** Buyer default: mount Sources orientation after primary workspace path tabs (RNX / REN / REQ / ENE). */
export function ReviewsNewBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="reviews-new-orientation-top">
      <ReviewsNewEvidenceOrientationStrip sources={REVIEWS_NEW_ORIENTATION_SOURCES} />
    </div>
  );
}
