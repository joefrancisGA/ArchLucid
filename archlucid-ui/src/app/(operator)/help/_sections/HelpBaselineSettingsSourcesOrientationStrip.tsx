"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  BASELINE_SETTINGS_HELP_FOLLOW_UPS_TITLE,
  BASELINE_SETTINGS_HELP_ORIENTATION_SOURCES_INTRO,
  BASELINE_SETTINGS_HELP_SOURCES,
} from "@/lib/baseline-settings-help-evidence-copy";
import { BASELINE_SETTINGS_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/baseline-settings-help-page-copy";
import {
  helpBaselineSettingsSourcesDisclosureHrefFromSearch,
  parseHelpBaselineSettingsSourcesOpenFromSearch,
} from "@/lib/help/help-baseline-settings-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open (HBS). */
export function HelpBaselineSettingsSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-baseline-settings-sources"
      searchParamKey="helpBaselineSettingsSourcesOpen"
      parseOpenFromSearch={parseHelpBaselineSettingsSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpBaselineSettingsSourcesDisclosureHrefFromSearch}
      sectionTestId={BASELINE_SETTINGS_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={BASELINE_SETTINGS_HELP_FOLLOW_UPS_TITLE}
      intro={BASELINE_SETTINGS_HELP_ORIENTATION_SOURCES_INTRO}
      links={BASELINE_SETTINGS_HELP_SOURCES}
      sourcesTestId="help-baseline-settings-sources"
    />
  );
}
