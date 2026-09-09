"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  COMPARE_FOLLOW_UPS_TITLE,
  COMPARE_ORIENTATION_SOURCES_INTRO,
  COMPARE_SOURCES,
} from "@/lib/compare-evidence-copy";
import { COMPARE_TWO_REVIEWS_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/compare-two-reviews-page-copy";
import {
  compareTwoReviewsSourcesDisclosureHrefFromSearch,
  parseCompareTwoReviewsSourcesOpenFromSearch,
} from "@/lib/insights/compare-two-reviews-sources-disclosure-url";

/** Sources-only follow-ups for `/insights/compare-two-reviews` buyer-polished shell (CXX). */
export function CompareSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const compareTwoReviewsSourcesOpenParam = searchParams.get("compareTwoReviewsSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseCompareTwoReviewsSourcesOpenFromSearch(compareTwoReviewsSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(compareTwoReviewsSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setSourcesOpen = useCallback(
    (open: boolean) => {
      setSourcesOpenState(open);
      syncSourcesOpenToUrl(open);
    },
    [syncSourcesOpenToUrl],
  );

  useEffect(() => {
    setSourcesOpenState(parseCompareTwoReviewsSourcesOpenFromSearch(compareTwoReviewsSourcesOpenParam));
  }, [compareTwoReviewsSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={COMPARE_FOLLOW_UPS_TITLE}
      summaryLine={COMPARE_ORIENTATION_SOURCES_INTRO}
      sectionTestId={COMPARE_TWO_REVIEWS_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="compare-two-reviews-sources"
        headingId="where-to-go-next"
        title={COMPARE_FOLLOW_UPS_TITLE}
        intro={COMPARE_ORIENTATION_SOURCES_INTRO}
        links={COMPARE_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
