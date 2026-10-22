import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  ARCHITECTURE_CREATED_FINDINGS_FOLLOW_UPS_TITLE,
  ARCHITECTURE_CREATED_FINDINGS_ORIENTATION_BOTTOM_TEST_ID,
  ARCHITECTURE_CREATED_FINDINGS_ORIENTATION_SOURCES_INTRO,
  ARCHITECTURE_CREATED_FINDINGS_SOURCES,
} from "@/lib/architecture/architecture-created-findings-sources";

/** Sources-only follow-ups for create-home Findings tab buyer-polished shell (REF). */
export function ArchitectureCreatedFindingsSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="architecture-findings"
      stripTestId={ARCHITECTURE_CREATED_FINDINGS_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="architecture-findings-sources"
      sourcesTitle={ARCHITECTURE_CREATED_FINDINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={ARCHITECTURE_CREATED_FINDINGS_ORIENTATION_SOURCES_INTRO}
      sources={ARCHITECTURE_CREATED_FINDINGS_SOURCES}
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
      hubSecondary
    />
  );
}
