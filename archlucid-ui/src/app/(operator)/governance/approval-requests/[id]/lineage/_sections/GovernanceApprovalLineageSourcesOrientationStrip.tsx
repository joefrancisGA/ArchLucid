import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  APPROVAL_LINEAGE_FOLLOW_UPS_TITLE,
  APPROVAL_LINEAGE_ORIENTATION_BOTTOM_TEST_ID,
  APPROVAL_LINEAGE_SOURCES,
  APPROVAL_LINEAGE_SOURCES_INTRO,
} from "@/lib/approval-lineage-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Sources-only follow-ups for `/governance/approval-requests/[id]/lineage` buyer-polished shell (GAI). */
export function GovernanceApprovalLineageSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="approval-lineage"
      stripTestId={APPROVAL_LINEAGE_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTitle={APPROVAL_LINEAGE_FOLLOW_UPS_TITLE}
      sourcesIntro={APPROVAL_LINEAGE_SOURCES_INTRO}
      sources={APPROVAL_LINEAGE_SOURCES}
      sourcesTestId="approval-lineage-sources"
      hubSecondary
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
    />
  );
}
