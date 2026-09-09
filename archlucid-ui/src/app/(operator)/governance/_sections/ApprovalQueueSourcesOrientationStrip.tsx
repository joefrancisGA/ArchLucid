import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  APPROVAL_QUEUE_FOLLOW_UPS_TITLE,
  APPROVAL_QUEUE_SOURCES,
  APPROVAL_QUEUE_SOURCES_INTRO,
  GOVERNANCE_APPROVAL_QUEUE_ORIENTATION_BOTTOM_TEST_ID,
} from "@/lib/approval-queue-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Sources-only follow-ups for `/governance/approval-queue` buyer-polished shell (GOP). */
export function ApprovalQueueSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="approval-queue"
      stripTestId={GOVERNANCE_APPROVAL_QUEUE_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="approval-queue-sources"
      sourcesTitle={APPROVAL_QUEUE_FOLLOW_UPS_TITLE}
      sourcesIntro={APPROVAL_QUEUE_SOURCES_INTRO}
      sources={APPROVAL_QUEUE_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
    />
  );
}
