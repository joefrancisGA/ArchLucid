"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  helpWebhooksIntegrationSourcesDisclosureHrefFromSearch,
  parseHelpWebhooksIntegrationSourcesOpenFromSearch,
} from "@/lib/help/help-webhooks-integration-sources-disclosure-url";
import {
  WEBHOOKS_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  WEBHOOKS_INTEGRATION_HELP_SOURCES,
  WEBHOOKS_INTEGRATION_HELP_SOURCES_INTRO,
} from "@/lib/webhooks-integration-help-evidence-copy";
import { WEBHOOKS_INTEGRATION_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/webhooks-integration-help-page-copy";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpWebhooksIntegrationSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-webhooks-integration-sources"
      searchParamKey="helpWebhooksIntegrationSourcesOpen"
      parseOpenFromSearch={parseHelpWebhooksIntegrationSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpWebhooksIntegrationSourcesDisclosureHrefFromSearch}
      sectionTestId={WEBHOOKS_INTEGRATION_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={WEBHOOKS_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      intro={WEBHOOKS_INTEGRATION_HELP_SOURCES_INTRO}
      links={WEBHOOKS_INTEGRATION_HELP_SOURCES}
      sourcesTestId="help-webhooks-integration-sources"
    />
  );
}
