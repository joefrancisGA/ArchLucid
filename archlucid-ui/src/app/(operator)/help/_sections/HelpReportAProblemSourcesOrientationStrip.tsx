import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  REPORT_A_PROBLEM_HELP_FOLLOW_UPS_TITLE,
  REPORT_A_PROBLEM_HELP_SOURCES,
  REPORT_A_PROBLEM_HELP_SOURCES_INTRO,
} from "@/lib/report-a-problem-help-evidence-copy";

/** Sources-only follow-ups for `/help/report-a-problem` buyer-polished shell (HRE). */
export function HelpReportAProblemSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="report-a-problem-help"
      sourcesTestId="help-report-a-problem-sources"
      sourcesTitle={REPORT_A_PROBLEM_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={REPORT_A_PROBLEM_HELP_SOURCES_INTRO}
      sources={REPORT_A_PROBLEM_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
