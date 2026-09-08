import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  COMPARE_FOLLOW_UPS_TITLE,
  COMPARE_SOURCES,
  COMPARE_SOURCES_INTRO,
} from "@/lib/compare-evidence-copy";

/** Sources-only follow-ups for `/insights/compare-two-reviews` buyer-polished shell (CXX). */
export function CompareSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="compare-two-reviews"
      stripTestId="compare-two-reviews-sources-strip"
      sourcesTestId="compare-two-reviews-sources"
      sourcesTitle={COMPARE_FOLLOW_UPS_TITLE}
      sourcesIntro={COMPARE_SOURCES_INTRO}
      sources={COMPARE_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
