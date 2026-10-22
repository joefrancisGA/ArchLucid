"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  PROCUREMENT_HELP_FOLLOW_UPS_TITLE,
  PROCUREMENT_HELP_ORIENTATION_SOURCES_INTRO,
  PROCUREMENT_HELP_SOURCES,
} from "@/lib/procurement-help-evidence-copy";
import { PROCUREMENT_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/procurement-help-page-copy";
import {
  helpProcurementSourcesDisclosureHrefFromSearch,
  parseHelpProcurementSourcesOpenFromSearch,
} from "@/lib/help/help-procurement-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open (PRO). */
export function HelpProcurementSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-procurement-sources"
      searchParamKey="helpProcurementSourcesOpen"
      parseOpenFromSearch={parseHelpProcurementSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpProcurementSourcesDisclosureHrefFromSearch}
      sectionTestId={PROCUREMENT_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={PROCUREMENT_HELP_FOLLOW_UPS_TITLE}
      intro={PROCUREMENT_HELP_ORIENTATION_SOURCES_INTRO}
      links={PROCUREMENT_HELP_SOURCES}
      sourcesTestId="procurement-help-sources"
    />
  );
}
