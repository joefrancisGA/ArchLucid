import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SLACK_INTEGRATION_FOLLOW_UPS_TITLE,
  SLACK_INTEGRATION_ORIENTATION_SOURCES_INTRO,
  SLACK_INTEGRATION_SOURCES,
} from "@/lib/slack-integration-evidence-copy";
import { SLACK_INTEGRATION_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/slack-integration-shell-page-copy";

/** Sources-only follow-ups for `/integrations/slack` buyer-polished shell (ISN). */
export function SlackIntegrationSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="slack-integration"
      stripTestId={SLACK_INTEGRATION_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="slack-integration-sources"
      sourcesTitle={SLACK_INTEGRATION_FOLLOW_UPS_TITLE}
      sourcesIntro={SLACK_INTEGRATION_ORIENTATION_SOURCES_INTRO}
      sources={SLACK_INTEGRATION_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
