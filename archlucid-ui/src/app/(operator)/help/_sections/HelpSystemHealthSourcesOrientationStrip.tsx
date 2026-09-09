"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  SYSTEM_HEALTH_HELP_FOLLOW_UPS_TITLE,
  SYSTEM_HEALTH_HELP_ORIENTATION_SOURCES_INTRO,
  SYSTEM_HEALTH_HELP_SOURCES,
} from "@/lib/system-health-help-evidence-copy";
import { SYSTEM_HEALTH_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/system-health-help-page-copy";
import {
  helpSystemHealthSourcesDisclosureHrefFromSearch,
  parseHelpSystemHealthSourcesOpenFromSearch,
} from "@/lib/help/help-system-health-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open (HEY). */
export function HelpSystemHealthSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-system-health-sources"
      searchParamKey="helpSystemHealthSourcesOpen"
      parseOpenFromSearch={parseHelpSystemHealthSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpSystemHealthSourcesDisclosureHrefFromSearch}
      sectionTestId={SYSTEM_HEALTH_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={SYSTEM_HEALTH_HELP_FOLLOW_UPS_TITLE}
      intro={SYSTEM_HEALTH_HELP_ORIENTATION_SOURCES_INTRO}
      links={SYSTEM_HEALTH_HELP_SOURCES}
      sourcesTestId="help-system-health-sources"
    />
  );
}
