import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SEARCH_REVIEW_EVIDENCE_CLAIM_DISCIPLINE,
  SEARCH_REVIEW_EVIDENCE_SOURCES,
  SEARCH_REVIEW_EVIDENCE_SOURCES_INTRO,
} from "@/lib/search-review-evidence-evidence-copy";

/** Claim discipline + Sources index for Search review evidence (SXX). */
export function SearchReviewEvidenceClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="search-review-evidence"
      claim={SEARCH_REVIEW_EVIDENCE_CLAIM_DISCIPLINE}
      claimHeading="Retrieval launcher only"
      sourcesIntro={SEARCH_REVIEW_EVIDENCE_SOURCES_INTRO}
      sources={SEARCH_REVIEW_EVIDENCE_SOURCES}
    />
  );
}
