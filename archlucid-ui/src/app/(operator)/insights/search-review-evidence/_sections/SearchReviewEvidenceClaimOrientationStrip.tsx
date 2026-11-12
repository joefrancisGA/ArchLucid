"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SEARCH_REVIEW_EVIDENCE_SOURCES_INTRO,
  resolveSearchReviewEvidenceSources,
} from "@/lib/search-review-evidence-evidence-copy";

/** Claim discipline + Sources index for Search review evidence (SXX). */
export function SearchReviewEvidenceClaimOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="search-review-evidence"
      sourcesIntro={SEARCH_REVIEW_EVIDENCE_SOURCES_INTRO}
      sources={resolveSearchReviewEvidenceSources(productLine)}
    />
  );
}
