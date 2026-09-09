import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  REVIEW_GUIDE_HELP_FOLLOW_UPS_TITLE,
  REVIEW_GUIDE_HELP_ORIENTATION_SOURCES_INTRO,
  REVIEW_GUIDE_HELP_SOURCES,
} from "@/lib/review-guide-help-evidence-copy";
import { REVIEW_GUIDE_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/review-guide-help-page-copy";

/** Sources-only follow-ups for `/help/review-guide` buyer-polished shell (HR). */
export function HelpReviewGuideSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-review-guide"
      stripTestId={REVIEW_GUIDE_HELP_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="help-review-guide-sources"
      sourcesTitle={REVIEW_GUIDE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={REVIEW_GUIDE_HELP_ORIENTATION_SOURCES_INTRO}
      sources={REVIEW_GUIDE_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
      hubSecondary
    />
  );
}
