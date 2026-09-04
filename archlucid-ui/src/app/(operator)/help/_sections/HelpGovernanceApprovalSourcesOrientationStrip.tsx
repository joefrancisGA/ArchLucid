import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  GOVERNANCE_APPROVAL_HELP_FOLLOW_UPS_TITLE,
  GOVERNANCE_APPROVAL_HELP_SOURCES,
  GOVERNANCE_APPROVAL_HELP_SOURCES_INTRO,
} from "@/lib/governance/governance-approval-help-evidence-copy";

/** Sources-only follow-ups for `/help/governance-approval` buyer-polished shell (GO). */
export function HelpGovernanceApprovalSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-governance-approval"
      sourcesTestId="help-governance-approval-sources"
      sourcesTitle={GOVERNANCE_APPROVAL_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={GOVERNANCE_APPROVAL_HELP_SOURCES_INTRO}
      sources={GOVERNANCE_APPROVAL_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
