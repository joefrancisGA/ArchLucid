"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildSignedRecordsReviewDetailPairwiseRail,
  type SignedRecordsReviewDetailSurfaceId,
  type SignedRecordsReviewDetailVocabularyModel,
} from "@/lib/vocabulary/signed-records-review-detail-vocabulary";

export type SignedRecordsReviewDetailVocabularyRailProps = {
  readonly currentSurfaceId: SignedRecordsReviewDetailSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: SignedRecordsReviewDetailVocabularyModel;
};

/**
 * TB-2272 — Compact vocabulary rail between Finalized review records inventory and review detail.
 * Mount on signed-records list and RunDetailPageView (compact).
 */
export function SignedRecordsReviewDetailVocabularyRail(
  props: SignedRecordsReviewDetailVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.signedRecordsLink,
          peerLink: props.model.reviewDetailLink,
        }
      : buildSignedRecordsReviewDetailPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="signed-records-review-detail-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
