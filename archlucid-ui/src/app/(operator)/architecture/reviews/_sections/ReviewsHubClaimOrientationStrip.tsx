import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";

import {
  REVIEWS_HUB_FOLLOW_UPS_TITLE,
  REVIEWS_HUB_SOURCES,
  REVIEWS_HUB_SOURCES_INTRO,
} from "@/lib/reviews-hub-evidence-copy";

/** Sources index for the architecture reviews hub (RE). */
export function ReviewsHubClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="reviews-hub"
      sourcesTitle={REVIEWS_HUB_FOLLOW_UPS_TITLE}
      sourcesIntro={REVIEWS_HUB_SOURCES_INTRO}
      sources={REVIEWS_HUB_SOURCES}
      hubSecondary
    />
  );
}
