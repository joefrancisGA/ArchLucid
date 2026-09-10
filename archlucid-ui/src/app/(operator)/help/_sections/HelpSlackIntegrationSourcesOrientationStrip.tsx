"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  SLACK_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  SLACK_INTEGRATION_HELP_ORIENTATION_SOURCES_INTRO,
  SLACK_INTEGRATION_HELP_SOURCES,
} from "@/lib/slack-integration-help-evidence-copy";
import { SLACK_INTEGRATION_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/slack-integration-help-page-copy";
import {
  helpSlackIntegrationSourcesDisclosureHrefFromSearch,
  parseHelpSlackIntegrationSourcesOpenFromSearch,
} from "@/lib/help/help-slack-integration-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open (HSL). */
export function HelpSlackIntegrationSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-slack-integration-sources"
      searchParamKey="helpSlackIntegrationSourcesOpen"
      parseOpenFromSearch={parseHelpSlackIntegrationSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpSlackIntegrationSourcesDisclosureHrefFromSearch}
      sectionTestId={SLACK_INTEGRATION_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={SLACK_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      intro={SLACK_INTEGRATION_HELP_ORIENTATION_SOURCES_INTRO}
      links={SLACK_INTEGRATION_HELP_SOURCES}
      sourcesTestId="help-slack-integration-sources"
    />
  );
}
