"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { SearchReviewEvidenceClaimOrientationStrip } from "./SearchReviewEvidenceClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources without editing the server page shell. */
export function SearchReviewEvidenceBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <SearchReviewEvidenceClaimOrientationStrip />;
}
