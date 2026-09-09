import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SLACK_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  SLACK_INTEGRATION_HELP_ORIENTATION_SOURCES_INTRO,
  SLACK_INTEGRATION_HELP_SOURCES,
} from "@/lib/slack-integration-help-evidence-copy";
import { SLACK_INTEGRATION_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/slack-integration-help-page-copy";

/** Sources-only follow-ups for `/help/slack-integration` buyer-polished shell (HSL). */
export function HelpSlackIntegrationSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-slack-integration"
      stripTestId={SLACK_INTEGRATION_HELP_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="help-slack-integration-sources"
      sourcesTitle={SLACK_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SLACK_INTEGRATION_HELP_ORIENTATION_SOURCES_INTRO}
      sources={SLACK_INTEGRATION_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
