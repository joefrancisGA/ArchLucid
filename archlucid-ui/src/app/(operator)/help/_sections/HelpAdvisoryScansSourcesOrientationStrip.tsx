import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ADVISORY_SCANS_HELP_FOLLOW_UPS_TITLE,
  ADVISORY_SCANS_HELP_SOURCES,
  ADVISORY_SCANS_HELP_SOURCES_INTRO,
} from "@/lib/advisory-scans-help-evidence-copy";

/** Sources-only follow-ups for `/help/advisory-scans` buyer-polished shell (HAD). */
export function HelpAdvisoryScansSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-advisory-scans"
      sourcesTestId="help-advisory-scans-sources"
      sourcesTitle={ADVISORY_SCANS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ADVISORY_SCANS_HELP_SOURCES_INTRO}
      sources={ADVISORY_SCANS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
