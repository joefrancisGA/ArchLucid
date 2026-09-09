import { OPERATOR_HOME_ORIENTATION_BOTTOM_TEST_ID } from "@/app/(operator)/_sections/operator-home-page-surface-copy";
import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  OPERATOR_HOME_FOLLOW_UPS_TITLE,
  OPERATOR_HOME_ORIENTATION_SOURCES,
  OPERATOR_HOME_ORIENTATION_SOURCES_INTRO,
} from "@/lib/operator/operator-home-evidence-copy";

/** Sources-only follow-ups for `/` buyer-polished shell (HOM). */
export function OperatorHomeSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="operator-home-settings"
      stripTestId={OPERATOR_HOME_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="operator-home-settings-sources"
      sourcesTitle={OPERATOR_HOME_FOLLOW_UPS_TITLE}
      sourcesIntro={OPERATOR_HOME_ORIENTATION_SOURCES_INTRO}
      sources={OPERATOR_HOME_ORIENTATION_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
      hubSecondary
    />
  );
}
