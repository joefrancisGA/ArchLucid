"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  helpReviewGuideSourcesDisclosureHrefFromSearch,
  parseHelpReviewGuideSourcesOpenFromSearch,
} from "@/lib/help/help-review-guide-sources-disclosure-url";
import {
  REVIEW_GUIDE_HELP_FOLLOW_UPS_TITLE,
  REVIEW_GUIDE_HELP_ORIENTATION_SOURCES_INTRO,
  REVIEW_GUIDE_HELP_SOURCES,
} from "@/lib/review-guide-help-evidence-copy";
import { REVIEW_GUIDE_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/review-guide-help-page-copy";

/** Sources-only follow-ups for `/help/review-guide` buyer-polished shell (HR). */
export function HelpReviewGuideSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpReviewGuideSourcesOpenParam = searchParams.get("helpReviewGuideSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpReviewGuideSourcesOpenFromSearch(helpReviewGuideSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpReviewGuideSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpReviewGuideSourcesOpenFromSearch(helpReviewGuideSourcesOpenParam));
  }, [helpReviewGuideSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={REVIEW_GUIDE_HELP_FOLLOW_UPS_TITLE}
      summaryLine={REVIEW_GUIDE_HELP_ORIENTATION_SOURCES_INTRO}
      sectionTestId={REVIEW_GUIDE_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-review-guide-sources"
        headingId="where-to-go-next"
        title={REVIEW_GUIDE_HELP_FOLLOW_UPS_TITLE}
        intro={REVIEW_GUIDE_HELP_ORIENTATION_SOURCES_INTRO}
        links={REVIEW_GUIDE_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
