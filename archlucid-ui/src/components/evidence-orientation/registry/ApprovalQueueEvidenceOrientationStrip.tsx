"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  APPROVAL_QUEUE_FOLLOW_UPS_TITLE,
  APPROVAL_QUEUE_SOURCES_INTRO,
  resolveApprovalQueueSources,
} from "@/lib/approval-queue-evidence-copy";

export function ApprovalQueueEvidenceOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="approval-queue"
      sourcesTitle={APPROVAL_QUEUE_FOLLOW_UPS_TITLE}
      sourcesIntro={APPROVAL_QUEUE_SOURCES_INTRO}
      sources={resolveApprovalQueueSources(productLine)}
      sourcesHeadingId="where-to-go-next"
    />
  );
}
