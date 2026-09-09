import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  JIRA_INTEGRATION_FOLLOW_UPS_TITLE,
  JIRA_INTEGRATION_ORIENTATION_SOURCES_INTRO,
  JIRA_INTEGRATION_SOURCES,
} from "@/lib/jira-integration-evidence-copy";

/** Sources-only follow-ups for `/integrations/jira` buyer-polished shell (IJX). */
export function JiraIntegrationSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="jira-integration"
      stripTestId="jira-integration-orientation-bottom"
      sourcesTestId="jira-integration-sources"
      sourcesTitle={JIRA_INTEGRATION_FOLLOW_UPS_TITLE}
      sourcesIntro={JIRA_INTEGRATION_ORIENTATION_SOURCES_INTRO}
      sources={JIRA_INTEGRATION_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
