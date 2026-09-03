import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SPONSOR_SUMMARY_HELP_FOLLOW_UPS_TITLE,
  SPONSOR_SUMMARY_HELP_SOURCES,
  SPONSOR_SUMMARY_HELP_SOURCES_INTRO,
} from "@/lib/sponsor/sponsor-report-help-evidence-copy";

/** Sources follow-ups for `/help/sponsor-report` (EXE). */
export function HelpSponsorReportClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-sponsor-report"
      sourcesTestId="help-sponsor-report-sources"
      sourcesTitle={SPONSOR_SUMMARY_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SPONSOR_SUMMARY_HELP_SOURCES_INTRO}
      sources={SPONSOR_SUMMARY_HELP_SOURCES}
    />
  );
}
