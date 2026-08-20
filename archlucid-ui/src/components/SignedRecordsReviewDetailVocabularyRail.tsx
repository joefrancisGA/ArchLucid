"use client";

import type { JSX } from "react";

import {
  buildSignedRecordsReviewDetailVocabulary,
  resolveSignedRecordsReviewDetailPeerLink,
  type SignedRecordsReviewDetailSurfaceId,
  type SignedRecordsReviewDetailVocabularyModel,
} from "@/lib/vocabulary/signed-records-review-detail-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type SignedRecordsReviewDetailVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: SignedRecordsReviewDetailSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildSignedRecordsReviewDetailVocabulary}. */
  readonly model?: SignedRecordsReviewDetailVocabularyModel;
};

/**
 * TB-2272 — Compact vocabulary rail between Sealed review records inventory and review detail.
 * Mount on signed-records list and RunDetailPageView (compact).
 */
export function SignedRecordsReviewDetailVocabularyRail(
  props: SignedRecordsReviewDetailVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildSignedRecordsReviewDetailVocabulary();
  const peer = resolveSignedRecordsReviewDetailPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "signed-records"
      ? model.signedRecordsLink
      : model.reviewDetailLink;

  return (
    <VocabularyRail
      testIdPrefix="signed-records-review-detail-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      compactLinkPlacement="inline"
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={[{ ...peer, testIdSuffix: "peer-link" }]}
    />
  );
}
