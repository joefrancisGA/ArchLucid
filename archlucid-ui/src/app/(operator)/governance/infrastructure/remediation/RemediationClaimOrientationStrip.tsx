import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_SOURCES,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_SOURCES_INTRO,
} from "@/lib/governance/governance-infrastructure-evidence-copy";

/** Claim discipline + Sources index for remediation factory (GRE). */
export function RemediationClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="governance-infrastructure-remediation"
      sourcesIntro={GOVERNANCE_INFRASTRUCTURE_REMEDIATION_SOURCES_INTRO}
      sources={GOVERNANCE_INFRASTRUCTURE_REMEDIATION_SOURCES}
    />
  );
}
