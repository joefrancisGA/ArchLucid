"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildApprovalLineageQueuePairwiseRail,
  type ApprovalLineageQueueSurfaceId,
  type ApprovalLineageQueueVocabularyModel,
} from "@/lib/vocabulary/approval-lineage-queue-vocabulary";

export type ApprovalLineageQueueVocabularyRailProps = {
  readonly currentSurfaceId: ApprovalLineageQueueSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: ApprovalLineageQueueVocabularyModel;
};

/**
 * TB-2271 — Compact vocabulary rail between Approval lineage and Approval queue.
 * Mount on lineage detail and the approval queue workflow page.
 */
export function ApprovalLineageQueueVocabularyRail(
  props: ApprovalLineageQueueVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.lineageLink,
          peerLink: props.model.queueLink,
        }
      : buildApprovalLineageQueuePairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="approval-lineage-queue-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
