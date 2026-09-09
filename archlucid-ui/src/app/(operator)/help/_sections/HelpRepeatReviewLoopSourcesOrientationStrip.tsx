"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  helpRepeatReviewLoopSourcesDisclosureHrefFromSearch,
  parseHelpRepeatReviewLoopSourcesOpenFromSearch,
} from "@/lib/help/help-repeat-review-loop-sources-disclosure-url";
import {
  REPEAT_REVIEW_LOOP_HELP_FOLLOW_UPS_TITLE,
  REPEAT_REVIEW_LOOP_HELP_ORIENTATION_SOURCES_INTRO,
  REPEAT_REVIEW_LOOP_HELP_SOURCES,
} from "@/lib/repeat-review-loop-help-evidence-copy";
import { REPEAT_REVIEW_LOOP_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/repeat-review-loop-help-page-copy";

/** Sources-only follow-ups for `/help/repeat-review-loop` buyer-polished shell (HRX). */
export function HelpRepeatReviewLoopSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpRepeatReviewLoopSourcesOpenParam = searchParams.get("helpRepeatReviewLoopSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpRepeatReviewLoopSourcesOpenFromSearch(helpRepeatReviewLoopSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpRepeatReviewLoopSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpRepeatReviewLoopSourcesOpenFromSearch(helpRepeatReviewLoopSourcesOpenParam));
  }, [helpRepeatReviewLoopSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={REPEAT_REVIEW_LOOP_HELP_FOLLOW_UPS_TITLE}
      summaryLine={REPEAT_REVIEW_LOOP_HELP_ORIENTATION_SOURCES_INTRO}
      sectionTestId={REPEAT_REVIEW_LOOP_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="repeat-review-loop-help-sources"
        headingId="where-to-go-next"
        title={REPEAT_REVIEW_LOOP_HELP_FOLLOW_UPS_TITLE}
        intro={REPEAT_REVIEW_LOOP_HELP_ORIENTATION_SOURCES_INTRO}
        links={REPEAT_REVIEW_LOOP_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
