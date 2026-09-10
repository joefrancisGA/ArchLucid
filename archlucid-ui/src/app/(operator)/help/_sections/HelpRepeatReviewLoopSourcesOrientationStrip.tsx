"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  REPEAT_REVIEW_LOOP_HELP_FOLLOW_UPS_TITLE,
  REPEAT_REVIEW_LOOP_HELP_ORIENTATION_SOURCES_INTRO,
  REPEAT_REVIEW_LOOP_HELP_SOURCES,
} from "@/lib/repeat-review-loop-help-evidence-copy";
import { REPEAT_REVIEW_LOOP_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/repeat-review-loop-help-page-copy";
import {
  helpRepeatReviewLoopSourcesDisclosureHrefFromSearch,
  parseHelpRepeatReviewLoopSourcesOpenFromSearch,
} from "@/lib/help/help-repeat-review-loop-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open (HRR). */
export function HelpRepeatReviewLoopSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-repeat-review-loop-sources"
      searchParamKey="helpRepeatReviewLoopSourcesOpen"
      parseOpenFromSearch={parseHelpRepeatReviewLoopSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpRepeatReviewLoopSourcesDisclosureHrefFromSearch}
      sectionTestId={REPEAT_REVIEW_LOOP_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={REPEAT_REVIEW_LOOP_HELP_FOLLOW_UPS_TITLE}
      intro={REPEAT_REVIEW_LOOP_HELP_ORIENTATION_SOURCES_INTRO}
      links={REPEAT_REVIEW_LOOP_HELP_SOURCES}
      sourcesTestId="help-repeat-review-loop-sources"
    />
  );
}
