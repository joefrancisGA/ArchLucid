import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ADVISORY_SCANS_FOLLOW_UPS_TITLE,
  ADVISORY_SCANS_ORIENTATION_SOURCES,
  ADVISORY_SCANS_TAB_SOURCES_INTRO,
} from "@/lib/advisory-scans-evidence-copy";

/** Sources follow-ups for `/governance/advisory-scans?tab=scans` (ADT). */
export function AdvisoryScansClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="advisory-scans"
      sourcesTestId="advisory-scans-sources"
      sourcesTitle={ADVISORY_SCANS_FOLLOW_UPS_TITLE}
      sourcesIntro={ADVISORY_SCANS_TAB_SOURCES_INTRO}
      sources={ADVISORY_SCANS_ORIENTATION_SOURCES}
      hubSecondary
    />
  );
}
