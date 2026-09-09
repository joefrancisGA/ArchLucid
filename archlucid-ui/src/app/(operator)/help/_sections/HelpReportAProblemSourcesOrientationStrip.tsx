"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  helpReportAProblemSourcesDisclosureHrefFromSearch,
  parseHelpReportAProblemSourcesOpenFromSearch,
} from "@/lib/help/help-report-a-problem-sources-disclosure-url";
import {
  REPORT_A_PROBLEM_HELP_FOLLOW_UPS_TITLE,
  REPORT_A_PROBLEM_HELP_SOURCES,
  REPORT_A_PROBLEM_HELP_SOURCES_INTRO,
} from "@/lib/report-a-problem-help-evidence-copy";
import { REPORT_A_PROBLEM_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/report-a-problem-help-page-copy";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpReportAProblemSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-report-a-problem-sources"
      searchParamKey="helpReportAProblemSourcesOpen"
      parseOpenFromSearch={parseHelpReportAProblemSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpReportAProblemSourcesDisclosureHrefFromSearch}
      sectionTestId={REPORT_A_PROBLEM_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={REPORT_A_PROBLEM_HELP_FOLLOW_UPS_TITLE}
      intro={REPORT_A_PROBLEM_HELP_SOURCES_INTRO}
      links={REPORT_A_PROBLEM_HELP_SOURCES}
      sourcesTestId="help-report-a-problem-sources"
    />
  );
}
