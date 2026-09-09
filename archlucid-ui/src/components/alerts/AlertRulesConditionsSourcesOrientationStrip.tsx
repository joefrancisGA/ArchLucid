import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  ALERT_RULES_CONDITIONS_FOLLOW_UPS_TITLE,
  ALERT_RULES_CONDITIONS_ORIENTATION_BOTTOM_TEST_ID,
  ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES,
  ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES_INTRO,
} from "@/lib/alert-rules-conditions-evidence-copy";

/** Sources-only follow-ups for `/governance/alert-rules?tab=rules` buyer-polished shell (GLR). */
export function AlertRulesConditionsSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="alert-rules-conditions"
      stripTestId={ALERT_RULES_CONDITIONS_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="alert-rules-conditions-sources"
      sourcesTitle={ALERT_RULES_CONDITIONS_FOLLOW_UPS_TITLE}
      sourcesIntro={ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES_INTRO}
      sources={ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
      hubSecondary
    />
  );
}
