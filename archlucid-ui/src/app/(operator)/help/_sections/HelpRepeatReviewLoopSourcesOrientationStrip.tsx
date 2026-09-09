import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  REPEAT_REVIEW_LOOP_HELP_FOLLOW_UPS_TITLE,
  REPEAT_REVIEW_LOOP_HELP_ORIENTATION_SOURCES_INTRO,
  REPEAT_REVIEW_LOOP_HELP_SOURCES,
} from "@/lib/repeat-review-loop-help-evidence-copy";
import { REPEAT_REVIEW_LOOP_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/repeat-review-loop-help-page-copy";

/** Sources-only follow-ups for `/help/repeat-review-loop` buyer-polished shell (HRX). */
export function HelpRepeatReviewLoopSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-repeat-review-loop"
      stripTestId={REPEAT_REVIEW_LOOP_HELP_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="repeat-review-loop-help-sources"
      sourcesTitle={REPEAT_REVIEW_LOOP_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={REPEAT_REVIEW_LOOP_HELP_ORIENTATION_SOURCES_INTRO}
      sources={REPEAT_REVIEW_LOOP_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
      hubSecondary
    />
  );
}
