"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  helpRoiSummarySourcesDisclosureHrefFromSearch,
  parseHelpRoiSummarySourcesOpenFromSearch,
} from "@/lib/help/help-roi-summary-sources-disclosure-url";
import {
  ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE,
  ROI_SUMMARY_HELP_SOURCES,
  ROI_SUMMARY_HELP_SOURCES_INTRO,
} from "@/lib/roi-summary-help-evidence-copy";
import { ROI_SUMMARY_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/roi-summary-help-page-copy";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpRoiSummarySourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-roi-summary-sources"
      searchParamKey="helpRoiSummarySourcesOpen"
      parseOpenFromSearch={parseHelpRoiSummarySourcesOpenFromSearch}
      disclosureHrefFromSearch={helpRoiSummarySourcesDisclosureHrefFromSearch}
      sectionTestId={ROI_SUMMARY_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE}
      intro={ROI_SUMMARY_HELP_SOURCES_INTRO}
      links={ROI_SUMMARY_HELP_SOURCES}
      sourcesTestId="help-roi-summary-sources"
    />
  );
}
