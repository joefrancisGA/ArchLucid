"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  AI_USAGE_HELP_FOLLOW_UPS_TITLE,
  AI_USAGE_HELP_ORIENTATION_SOURCES_INTRO,
  AI_USAGE_HELP_SOURCES,
} from "@/lib/ai-usage-help-evidence-copy";
import { AI_USAGE_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/ai-usage-help-page-copy";
import {
  helpAiUsageSourcesDisclosureHrefFromSearch,
  parseHelpAiUsageSourcesOpenFromSearch,
} from "@/lib/help/help-ai-usage-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpAiUsageSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-ai-usage-sources"
      searchParamKey="helpAiUsageSourcesOpen"
      parseOpenFromSearch={parseHelpAiUsageSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpAiUsageSourcesDisclosureHrefFromSearch}
      sectionTestId={AI_USAGE_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={AI_USAGE_HELP_FOLLOW_UPS_TITLE}
      intro={AI_USAGE_HELP_ORIENTATION_SOURCES_INTRO}
      links={AI_USAGE_HELP_SOURCES}
      sourcesTestId="help-ai-usage-sources"
    />
  );
}
