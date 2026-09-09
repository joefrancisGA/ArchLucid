"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  ALERTS_HELP_FOLLOW_UPS_TITLE,
  ALERTS_HELP_SOURCES,
  ALERTS_HELP_SOURCES_INTRO,
} from "@/lib/alerts-help-evidence-copy";
import { ALERTS_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/alerts-help-page-copy";
import {
  helpAlertsSourcesDisclosureHrefFromSearch,
  parseHelpAlertsSourcesOpenFromSearch,
} from "@/lib/help/help-alerts-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpAlertsSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-alerts-sources"
      searchParamKey="helpAlertsSourcesOpen"
      parseOpenFromSearch={parseHelpAlertsSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpAlertsSourcesDisclosureHrefFromSearch}
      sectionTestId={ALERTS_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={ALERTS_HELP_FOLLOW_UPS_TITLE}
      intro={ALERTS_HELP_SOURCES_INTRO}
      links={ALERTS_HELP_SOURCES}
      sourcesTestId="help-alerts-sources"
    />
  );
}
