import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  APPROVAL_LINEAGE_FOLLOW_UPS_TITLE,
  APPROVAL_LINEAGE_SOURCES,
  APPROVAL_LINEAGE_SOURCES_INTRO,
} from "@/lib/approval-lineage-evidence-copy";

/** Sources index for approval lineage detail (GAI). Claim discipline lives in the page header. */
export function GovernanceApprovalLineageClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="approval-lineage"
      sourcesTitle={APPROVAL_LINEAGE_FOLLOW_UPS_TITLE}
      sourcesIntro={APPROVAL_LINEAGE_SOURCES_INTRO}
      sources={APPROVAL_LINEAGE_SOURCES}
      sourcesTestId="approval-lineage-sources"
      hubSecondary
    />
  );
}
