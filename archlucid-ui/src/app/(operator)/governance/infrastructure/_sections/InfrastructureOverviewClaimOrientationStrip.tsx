import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_SOURCES,
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_SOURCES_INTRO,
} from "@/lib/governance/governance-infrastructure-evidence-copy";

/** Claim discipline + Sources index for infrastructure overview hub (GOI). */
export function InfrastructureOverviewClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="governance-infrastructure-overview"
      sourcesIntro={GOVERNANCE_INFRASTRUCTURE_OVERVIEW_SOURCES_INTRO}
      sources={GOVERNANCE_INFRASTRUCTURE_OVERVIEW_SOURCES}
    />
  );
}
