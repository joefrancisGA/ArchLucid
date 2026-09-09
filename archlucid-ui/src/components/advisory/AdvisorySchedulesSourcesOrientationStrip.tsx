import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  ADVISORY_SCHEDULES_FOLLOW_UPS_TITLE,
  ADVISORY_SCHEDULES_ORIENTATION_BOTTOM_TEST_ID,
  ADVISORY_SCHEDULES_ORIENTATION_SOURCES,
  ADVISORY_SCHEDULES_SOURCES_INTRO,
} from "@/lib/advisory-schedules-evidence-copy";

/** Sources-only follow-ups for `/governance/advisory-scans?tab=schedules` buyer-polished shell (AD). */
export function AdvisorySchedulesSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="advisory-schedules"
      stripTestId={ADVISORY_SCHEDULES_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="advisory-schedules-sources"
      sourcesTitle={ADVISORY_SCHEDULES_FOLLOW_UPS_TITLE}
      sourcesIntro={ADVISORY_SCHEDULES_SOURCES_INTRO}
      sources={ADVISORY_SCHEDULES_ORIENTATION_SOURCES}
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
      hubSecondary
    />
  );
}
