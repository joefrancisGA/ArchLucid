import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  ARCHITECTURE_CREATED_GOVERNANCE_FOLLOW_UPS_TITLE,
  ARCHITECTURE_CREATED_GOVERNANCE_ORIENTATION_BOTTOM_TEST_ID,
  ARCHITECTURE_CREATED_GOVERNANCE_ORIENTATION_SOURCES_INTRO,
  ARCHITECTURE_CREATED_GOVERNANCE_SOURCES,
} from "@/lib/architecture/architecture-created-governance-sources";

/** Sources-only follow-ups for create-home Governance tab buyer-polished shell (REG). */
export function ArchitectureCreatedGovernanceSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="architecture-governance"
      stripTestId={ARCHITECTURE_CREATED_GOVERNANCE_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="architecture-governance-sources"
      sourcesTitle={ARCHITECTURE_CREATED_GOVERNANCE_FOLLOW_UPS_TITLE}
      sourcesIntro={ARCHITECTURE_CREATED_GOVERNANCE_ORIENTATION_SOURCES_INTRO}
      sources={ARCHITECTURE_CREATED_GOVERNANCE_SOURCES}
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
      hubSecondary
    />
  );
}
