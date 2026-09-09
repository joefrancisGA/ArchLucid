"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  CORE_PILOT_HELP_FOLLOW_UPS_TITLE,
  CORE_PILOT_HELP_ORIENTATION_SOURCES_INTRO,
  CORE_PILOT_HELP_SOURCES,
} from "@/lib/core-pilot-help-evidence-copy";
import { CORE_PILOT_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/core-pilot-help-page-copy";
import {
  helpCorePilotSourcesDisclosureHrefFromSearch,
  parseHelpCorePilotSourcesOpenFromSearch,
} from "@/lib/help/help-core-pilot-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpCorePilotSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="core-pilot-help-sources"
      searchParamKey="helpCorePilotSourcesOpen"
      parseOpenFromSearch={parseHelpCorePilotSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpCorePilotSourcesDisclosureHrefFromSearch}
      sectionTestId={CORE_PILOT_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={CORE_PILOT_HELP_FOLLOW_UPS_TITLE}
      intro={CORE_PILOT_HELP_ORIENTATION_SOURCES_INTRO}
      links={CORE_PILOT_HELP_SOURCES}
      sourcesTestId="core-pilot-help-sources"
    />
  );
}
