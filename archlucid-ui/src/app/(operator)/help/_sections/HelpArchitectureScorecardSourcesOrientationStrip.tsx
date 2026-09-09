"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE,
  ARCHITECTURE_SCORECARD_HELP_SOURCES,
  ARCHITECTURE_SCORECARD_HELP_SOURCES_INTRO,
} from "@/lib/architecture-scorecard-help-evidence-copy";
import { ARCHITECTURE_SCORECARD_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/architecture-scorecard-help-page-copy";
import {
  helpArchitectureScorecardSourcesDisclosureHrefFromSearch,
  parseHelpArchitectureScorecardSourcesOpenFromSearch,
} from "@/lib/help/help-architecture-scorecard-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpArchitectureScorecardSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-architecture-scorecard-sources"
      searchParamKey="helpArchitectureScorecardSourcesOpen"
      parseOpenFromSearch={parseHelpArchitectureScorecardSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpArchitectureScorecardSourcesDisclosureHrefFromSearch}
      sectionTestId={ARCHITECTURE_SCORECARD_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE}
      intro={ARCHITECTURE_SCORECARD_HELP_SOURCES_INTRO}
      links={ARCHITECTURE_SCORECARD_HELP_SOURCES}
      sourcesTestId="help-architecture-scorecard-sources"
    />
  );
}
