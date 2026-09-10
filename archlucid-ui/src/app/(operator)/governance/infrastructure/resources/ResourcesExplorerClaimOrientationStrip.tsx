import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_SOURCES,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_SOURCES_INTRO,
} from "@/lib/governance/governance-infrastructure-evidence-copy";

/** Claim discipline + Sources index for resource explorer (NRE). */
export function ResourcesExplorerClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="governance-infrastructure-resources"
      sourcesIntro={GOVERNANCE_INFRASTRUCTURE_RESOURCES_SOURCES_INTRO}
      sources={GOVERNANCE_INFRASTRUCTURE_RESOURCES_SOURCES}
    />
  );
}
