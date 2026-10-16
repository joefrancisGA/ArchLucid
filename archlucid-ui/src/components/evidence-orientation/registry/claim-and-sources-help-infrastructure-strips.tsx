import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_DISCIPLINE_HEADING,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_FOLLOW_UPS_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_SOURCES,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_SOURCES_INTRO,
} from "@/lib/governance/governance-infrastructure-drift-help-evidence-copy";
import { GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_HEADING_ID } from "@/lib/governance/governance-infrastructure-drift-help-guide-content";
import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_CLAIM_DISCIPLINE_HEADING,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_FOLLOW_UPS_TITLE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_SOURCES,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_SOURCES_INTRO,
} from "@/lib/governance/governance-infrastructure-resources-help-evidence-copy";
import { GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_CLAIM_HEADING_ID } from "@/lib/governance/governance-infrastructure-resources-help-guide-content";
import {
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_CLAIM_DISCIPLINE_HEADING,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_FOLLOW_UPS_TITLE,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_SOURCES,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_SOURCES_INTRO,
} from "@/lib/governance/governance-infrastructure-terraform-help-evidence-copy";
import { GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_CLAIM_HEADING_ID } from "@/lib/governance/governance-infrastructure-terraform-help-guide-content";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_DISCIPLINE_HEADING,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_FOLLOW_UPS_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_SOURCES,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_SOURCES_INTRO,
} from "@/lib/governance/governance-infrastructure-diagrams-help-evidence-copy";
import { GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_HEADING_ID } from "@/lib/governance/governance-infrastructure-diagrams-help-guide-content";

export function GovernanceInfrastructureDriftHelpEvidenceOrientationStrip(
  props: { readonly readingBodyClassName?: string } = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-governance-infrastructure-drift"
      claim={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_DISCIPLINE}
      claimHeading={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_HEADING_ID}
      sourcesTitle={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_SOURCES_INTRO}
      sources={GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function GovernanceInfrastructureResourcesHelpEvidenceOrientationStrip(
  props: { readonly readingBodyClassName?: string } = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-governance-infrastructure-resources"
      claim={GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_CLAIM_DISCIPLINE}
      claimHeading={GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_CLAIM_HEADING_ID}
      sourcesTitle={GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_SOURCES_INTRO}
      sources={GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function GovernanceInfrastructureTerraformHelpEvidenceOrientationStrip(
  props: { readonly readingBodyClassName?: string } = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-governance-infrastructure-terraform"
      claim={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_CLAIM_DISCIPLINE}
      claimHeading={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_CLAIM_HEADING_ID}
      sourcesTitle={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_SOURCES_INTRO}
      sources={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function GovernanceInfrastructureDiagramsHelpEvidenceOrientationStrip(
  props: { readonly readingBodyClassName?: string } = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-governance-infrastructure-diagrams"
      claim={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_DISCIPLINE}
      claimHeading={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_HEADING_ID}
      sourcesTitle={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_SOURCES_INTRO}
      sources={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}
