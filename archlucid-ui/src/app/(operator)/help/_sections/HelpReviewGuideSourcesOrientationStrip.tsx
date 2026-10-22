"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  REVIEW_GUIDE_HELP_FOLLOW_UPS_TITLE,
  REVIEW_GUIDE_HELP_ORIENTATION_SOURCES_INTRO,
  REVIEW_GUIDE_HELP_SOURCES,
} from "@/lib/review-guide-help-evidence-copy";
import { REVIEW_GUIDE_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/review-guide-help-page-copy";
import {
  helpReviewGuideSourcesDisclosureHrefFromSearch,
  parseHelpReviewGuideSourcesOpenFromSearch,
} from "@/lib/help/help-review-guide-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open (HR). */
export function HelpReviewGuideSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-review-guide-sources"
      searchParamKey="helpReviewGuideSourcesOpen"
      parseOpenFromSearch={parseHelpReviewGuideSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpReviewGuideSourcesDisclosureHrefFromSearch}
      sectionTestId={REVIEW_GUIDE_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={REVIEW_GUIDE_HELP_FOLLOW_UPS_TITLE}
      intro={REVIEW_GUIDE_HELP_ORIENTATION_SOURCES_INTRO}
      links={REVIEW_GUIDE_HELP_SOURCES}
      sourcesTestId="help-review-guide-sources"
    />
  );
}
