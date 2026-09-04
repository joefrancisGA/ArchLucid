import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE,
  ROI_SUMMARY_HELP_SOURCES,
  ROI_SUMMARY_HELP_SOURCES_INTRO,
} from "@/lib/roi-summary-help-evidence-copy";

/** Sources-only follow-ups for `/help/roi-summary` buyer-polished shell (HRO). */
export function HelpRoiSummarySourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-roi-summary"
      sourcesTestId="help-roi-summary-sources"
      sourcesTitle={ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ROI_SUMMARY_HELP_SOURCES_INTRO}
      sources={ROI_SUMMARY_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
