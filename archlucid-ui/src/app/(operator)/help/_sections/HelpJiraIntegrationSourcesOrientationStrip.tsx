"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  helpJiraIntegrationSourcesDisclosureHrefFromSearch,
  parseHelpJiraIntegrationSourcesOpenFromSearch,
} from "@/lib/help/help-jira-integration-sources-disclosure-url";
import {
  JIRA_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  JIRA_INTEGRATION_HELP_ORIENTATION_SOURCES_INTRO,
  JIRA_INTEGRATION_HELP_SOURCES,
} from "@/lib/jira-integration-help-evidence-copy";
import { JIRA_INTEGRATION_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/jira-integration-help-page-copy";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpJiraIntegrationSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-jira-integration-sources"
      searchParamKey="helpJiraIntegrationSourcesOpen"
      parseOpenFromSearch={parseHelpJiraIntegrationSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpJiraIntegrationSourcesDisclosureHrefFromSearch}
      sectionTestId={JIRA_INTEGRATION_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={JIRA_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      intro={JIRA_INTEGRATION_HELP_ORIENTATION_SOURCES_INTRO}
      links={JIRA_INTEGRATION_HELP_SOURCES}
      sourcesTestId="help-jira-integration-sources"
    />
  );
}
