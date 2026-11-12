"use client";

import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";

import {
  REVIEWS_HUB_FOLLOW_UPS_TITLE,
  REVIEWS_HUB_SOURCES_INTRO,
  buildReviewsHubSources,
} from "@/lib/reviews-hub-evidence-copy";

/** Sources index for the architecture reviews hub (RE). */
export function ReviewsHubClaimOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();
  const { isWorkingMode } = useWorkspaceMode();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="reviews-hub"
      sourcesTitle={REVIEWS_HUB_FOLLOW_UPS_TITLE}
      sourcesIntro={REVIEWS_HUB_SOURCES_INTRO}
      sources={buildReviewsHubSources(isWorkingMode, productLine)}
      hubSecondary
    />
  );
}
