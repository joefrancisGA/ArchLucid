import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ADVISORY_SCHEDULES_FOLLOW_UPS_TITLE,
  ADVISORY_SCHEDULES_ORIENTATION_SOURCES,
  ADVISORY_SCHEDULES_SOURCES_INTRO,
} from "@/lib/advisory-schedules-evidence-copy";

/** Sources follow-ups for `/governance/advisory-scans?tab=schedules` (AD). */
export function AdvisorySchedulesClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="advisory-schedules"
      sourcesTestId="advisory-schedules-sources"
      sourcesTitle={ADVISORY_SCHEDULES_FOLLOW_UPS_TITLE}
      sourcesIntro={ADVISORY_SCHEDULES_SOURCES_INTRO}
      sources={ADVISORY_SCHEDULES_ORIENTATION_SOURCES}
      hubSecondary
    />
  );
}
