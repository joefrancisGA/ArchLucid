"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  AZURE_BOARDS_HELP_FOLLOW_UPS_TITLE,
  AZURE_BOARDS_HELP_SOURCES,
  AZURE_BOARDS_HELP_SOURCES_INTRO,
} from "@/lib/azure-boards-help-evidence-copy";
import { AZURE_BOARDS_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/azure-boards-help-page-copy";
import {
  helpAzureBoardsSourcesDisclosureHrefFromSearch,
  parseHelpAzureBoardsSourcesOpenFromSearch,
} from "@/lib/help/help-azure-boards-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpAzureBoardsSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-azure-boards-sources"
      searchParamKey="helpAzureBoardsSourcesOpen"
      parseOpenFromSearch={parseHelpAzureBoardsSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpAzureBoardsSourcesDisclosureHrefFromSearch}
      sectionTestId={AZURE_BOARDS_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={AZURE_BOARDS_HELP_FOLLOW_UPS_TITLE}
      intro={AZURE_BOARDS_HELP_SOURCES_INTRO}
      links={AZURE_BOARDS_HELP_SOURCES}
      sourcesTestId="help-azure-boards-sources"
    />
  );
}
