import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  APPROVAL_QUEUE_FOLLOW_UPS_TITLE,
  APPROVAL_QUEUE_SOURCES,
  APPROVAL_QUEUE_SOURCES_INTRO,
} from "@/lib/approval-queue-evidence-copy";

/** Sources follow-ups for approval queue buyer shell (GOP). */
export function ApprovalQueueClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="approval-queue"
      sourcesTestId="approval-queue-sources"
      sourcesTitle={APPROVAL_QUEUE_FOLLOW_UPS_TITLE}
      sourcesIntro={APPROVAL_QUEUE_SOURCES_INTRO}
      sources={APPROVAL_QUEUE_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
