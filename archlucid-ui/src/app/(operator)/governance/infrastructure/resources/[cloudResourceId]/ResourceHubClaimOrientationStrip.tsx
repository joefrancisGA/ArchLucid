import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_SOURCES,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_SOURCES_INTRO,
} from "@/lib/governance/governance-infrastructure-evidence-copy";

/** Claim discipline + Sources index for resource evidence hub (GOL). */
export function ResourceHubClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="governance-infrastructure-resource-hub"
      sourcesIntro={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_SOURCES_INTRO}
      sources={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_SOURCES}
    />
  );
}
