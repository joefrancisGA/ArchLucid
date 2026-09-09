"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  SCOPE_HELP_FOLLOW_UPS_TITLE,
  SCOPE_HELP_SOURCES,
  SCOPE_HELP_SOURCES_INTRO,
} from "@/lib/scope-help-evidence-copy";
import { SCOPE_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/scope-help-page-copy";
import {
  helpScopeSourcesDisclosureHrefFromSearch,
  parseHelpScopeSourcesOpenFromSearch,
} from "@/lib/help/help-scope-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpScopeSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-scope-sources"
      searchParamKey="helpScopeSourcesOpen"
      parseOpenFromSearch={parseHelpScopeSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpScopeSourcesDisclosureHrefFromSearch}
      sectionTestId={SCOPE_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={SCOPE_HELP_FOLLOW_UPS_TITLE}
      intro={SCOPE_HELP_SOURCES_INTRO}
      links={SCOPE_HELP_SOURCES}
      sourcesTestId="help-scope-sources"
    />
  );
}
