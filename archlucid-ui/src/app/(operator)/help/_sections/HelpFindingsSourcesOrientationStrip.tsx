"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  FINDINGS_HELP_FOLLOW_UPS_TITLE,
  FINDINGS_HELP_SOURCES,
  FINDINGS_HELP_SOURCES_INTRO,
} from "@/lib/findings/findings-help-evidence-copy";
import { FINDINGS_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/findings/findings-help-page-copy";
import {
  helpFindingsSourcesDisclosureHrefFromSearch,
  parseHelpFindingsSourcesOpenFromSearch,
} from "@/lib/help/help-findings-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpFindingsSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-findings-sources"
      searchParamKey="helpFindingsSourcesOpen"
      parseOpenFromSearch={parseHelpFindingsSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpFindingsSourcesDisclosureHrefFromSearch}
      sectionTestId={FINDINGS_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={FINDINGS_HELP_FOLLOW_UPS_TITLE}
      intro={FINDINGS_HELP_SOURCES_INTRO}
      links={FINDINGS_HELP_SOURCES}
      sourcesTestId="help-findings-sources"
    />
  );
}
