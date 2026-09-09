import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  JIRA_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  JIRA_INTEGRATION_HELP_ORIENTATION_SOURCES_INTRO,
  JIRA_INTEGRATION_HELP_SOURCES,
} from "@/lib/jira-integration-help-evidence-copy";
import { JIRA_INTEGRATION_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/jira-integration-help-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Sources-only follow-ups for `/help/jira-integration` buyer-polished shell (HEJ). */
export function HelpJiraIntegrationSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="jira-integration-help"
      stripTestId={JIRA_INTEGRATION_HELP_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="help-jira-integration-sources"
      sourcesTitle={JIRA_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={JIRA_INTEGRATION_HELP_ORIENTATION_SOURCES_INTRO}
      sources={JIRA_INTEGRATION_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
      hubSecondary
    />
  );
}
