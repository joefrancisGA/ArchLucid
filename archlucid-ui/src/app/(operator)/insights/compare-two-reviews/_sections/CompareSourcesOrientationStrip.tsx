import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  COMPARE_FOLLOW_UPS_TITLE,
  COMPARE_ORIENTATION_SOURCES_INTRO,
  COMPARE_SOURCES,
} from "@/lib/compare-evidence-copy";
import { COMPARE_TWO_REVIEWS_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/compare-two-reviews-page-copy";

/** Sources-only follow-ups for `/insights/compare-two-reviews` buyer-polished shell (CXX). */
export function CompareSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="compare-two-reviews"
      stripTestId={COMPARE_TWO_REVIEWS_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="compare-two-reviews-sources"
      sourcesTitle={COMPARE_FOLLOW_UPS_TITLE}
      sourcesIntro={COMPARE_ORIENTATION_SOURCES_INTRO}
      sources={COMPARE_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
