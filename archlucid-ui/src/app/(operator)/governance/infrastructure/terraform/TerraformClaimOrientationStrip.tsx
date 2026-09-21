import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SOURCES,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SOURCES_INTRO,
} from "@/lib/governance/governance-infrastructure-evidence-copy";

/** Claim discipline + Sources index for Terraform mapping workbench (ITE). */
export function TerraformClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="governance-infrastructure-terraform"
      sourcesIntro={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SOURCES_INTRO}
      sources={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SOURCES}
    />
  );
}
