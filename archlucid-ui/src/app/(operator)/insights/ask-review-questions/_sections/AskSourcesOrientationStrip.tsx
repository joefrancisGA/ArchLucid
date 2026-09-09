"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  ASK_REVIEW_QUESTIONS_FOLLOW_UPS_TITLE,
  ASK_REVIEW_QUESTIONS_SOURCES_INTRO,
  buildAskReviewQuestionsSources,
} from "@/lib/ask-review-questions-evidence-copy";
import { ASK_REVIEW_QUESTIONS_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/ask-review-questions-page-copy";
import {
  askReviewQuestionsSourcesDisclosureHrefFromSearch,
  parseAskReviewQuestionsSourcesOpenFromSearch,
} from "@/lib/insights/ask-review-questions-sources-disclosure-url";

/** Sources-only follow-ups for `/insights/ask-review-questions` buyer-polished shell (ASK). */
export function AskSourcesOrientationStrip(): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("askReviewQuestionsSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseAskReviewQuestionsSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(askReviewQuestionsSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseAskReviewQuestionsSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={ASK_REVIEW_QUESTIONS_FOLLOW_UPS_TITLE}
      summaryLine={ASK_REVIEW_QUESTIONS_SOURCES_INTRO}
      sectionTestId={ASK_REVIEW_QUESTIONS_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="ask-review-questions-sources"
        headingId="where-to-go-next"
        title={ASK_REVIEW_QUESTIONS_FOLLOW_UPS_TITLE}
        intro={ASK_REVIEW_QUESTIONS_SOURCES_INTRO}
        links={buildAskReviewQuestionsSources(isWorkingMode)}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
