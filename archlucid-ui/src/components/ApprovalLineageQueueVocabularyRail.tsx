"use client";

import type { JSX } from "react";

import {
  buildApprovalLineageQueueVocabulary,
  resolveApprovalLineageQueuePeerLink,
  type ApprovalLineageQueueSurfaceId,
  type ApprovalLineageQueueVocabularyModel,
} from "@/lib/vocabulary/approval-lineage-queue-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type ApprovalLineageQueueVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: ApprovalLineageQueueSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildApprovalLineageQueueVocabulary}. */
  readonly model?: ApprovalLineageQueueVocabularyModel;
};

/**
 * TB-2271 — Compact vocabulary rail between Approval lineage and Approval queue.
 * Mount on lineage detail and the approval queue workflow page.
 */
export function ApprovalLineageQueueVocabularyRail(
  props: ApprovalLineageQueueVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildApprovalLineageQueueVocabulary();
  const peer = resolveApprovalLineageQueuePeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "approval-lineage" ? model.lineageLink : model.queueLink;

  return (
    <VocabularyRail
      testIdPrefix="approval-lineage-queue-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={[{ ...peer, testIdSuffix: "peer-link" }]}
    />
  );
}
