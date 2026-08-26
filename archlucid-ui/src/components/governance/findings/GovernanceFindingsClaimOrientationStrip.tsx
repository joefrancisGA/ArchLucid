import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  GOVERNANCE_FINDINGS_FOLLOW_UPS_TITLE,
  GOVERNANCE_FINDINGS_SOURCES,
  GOVERNANCE_FINDINGS_SOURCES_INTRO,
} from "@/lib/governance/governance-findings-evidence-copy";

/** Claim discipline + Sources index for the governance findings queue (GFN). */
export function GovernanceFindingsClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="governance-findings"
      sourcesTitle={GOVERNANCE_FINDINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={GOVERNANCE_FINDINGS_SOURCES_INTRO}
      sources={GOVERNANCE_FINDINGS_SOURCES}
      hubSecondary
    />
  );
}
