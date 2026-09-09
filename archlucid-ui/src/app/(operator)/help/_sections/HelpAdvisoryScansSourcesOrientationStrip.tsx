"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  ADVISORY_SCANS_HELP_FOLLOW_UPS_TITLE,
  ADVISORY_SCANS_HELP_SOURCES,
  ADVISORY_SCANS_HELP_SOURCES_INTRO,
} from "@/lib/advisory-scans-help-evidence-copy";
import { ADVISORY_SCANS_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/advisory-scans-help-page-copy";
import {
  helpAdvisoryScansSourcesDisclosureHrefFromSearch,
  parseHelpAdvisoryScansSourcesOpenFromSearch,
} from "@/lib/help/help-advisory-scans-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpAdvisoryScansSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-advisory-scans-sources"
      searchParamKey="helpAdvisoryScansSourcesOpen"
      parseOpenFromSearch={parseHelpAdvisoryScansSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpAdvisoryScansSourcesDisclosureHrefFromSearch}
      sectionTestId={ADVISORY_SCANS_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={ADVISORY_SCANS_HELP_FOLLOW_UPS_TITLE}
      intro={ADVISORY_SCANS_HELP_SOURCES_INTRO}
      links={ADVISORY_SCANS_HELP_SOURCES}
      sourcesTestId="help-advisory-scans-sources"
    />
  );
}
