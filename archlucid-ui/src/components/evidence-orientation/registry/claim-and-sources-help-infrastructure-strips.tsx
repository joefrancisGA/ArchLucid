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
