/**
 * TB-2272 — Sealed review records ≠ review detail vocabulary rail.
 *
 * Why two surfaces exist:
 * - Sealed review records (`/governance/sealed-records`) is the *inventory* of
 *   finalized review records for diligence and governance follow-up.
 * - Review detail (`/architecture/reviews/[reviewId]`) is the *architecture
 *   package* workspace for one review — findings, evidence, and finalize.
 *
 * They stay separate because browsing sealed records is not the same task as
 * working inside one architecture package. Open the peer when you need both.
 */

import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type SignedRecordsReviewDetailSurfaceId = "signed-records" | "review-detail";

export type SignedRecordsReviewDetailLink = {
  readonly id: SignedRecordsReviewDetailSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type SignedRecordsReviewDetailVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly signedRecordsLink: SignedRecordsReviewDetailLink;
  readonly reviewDetailLink: SignedRecordsReviewDetailLink;
};

export const SIGNED_RECORDS_REVIEW_DETAIL_HEADING =
  "Finalized review records and review detail serve different purposes" as const;

export const SIGNED_RECORDS_REVIEW_DETAIL_WHY_TWO =
  "Finalized review records lists all finalized reviews. Review detail is where you work on one review — findings, evidence, and finalize. The list is not the workspace." as const;

export const SIGNED_RECORDS_REVIEW_DETAIL_COMPACT_LINE =
  "Finalized review records lists finalized reviews; review detail is one active review — open the other when you need both." as const;

export const SIGNED_RECORDS_REVIEW_DETAIL_SIGNED_RECORDS_LINK: SignedRecordsReviewDetailLink = {
  id: "signed-records",
  label: "Finalized review records",
  href: SIGNED_RECORDS_LIST_PATH,
  whenToUse: "Browse all finalized review records.",
};

/** Review detail is per-package; href uses the reviews hub as the stable peer home. */
export const SIGNED_RECORDS_REVIEW_DETAIL_REVIEW_DETAIL_LINK: SignedRecordsReviewDetailLink = {
  id: "review-detail",
  label: "Review detail",
  href: REVIEWS_LIST_PATH,
  whenToUse: "Open an architecture package workspace for findings, evidence, and finalize.",
};

/** Pairwise model for Sealed review records ↔ Review detail (fixed routes). */
export function buildSignedRecordsReviewDetailPairwiseRail(): PairwiseVocabularyRailModel<SignedRecordsReviewDetailSurfaceId> {
  return {
    heading: SIGNED_RECORDS_REVIEW_DETAIL_HEADING,
    whyTwo: SIGNED_RECORDS_REVIEW_DETAIL_WHY_TWO,
    compactLine: SIGNED_RECORDS_REVIEW_DETAIL_COMPACT_LINE,
    currentLink: SIGNED_RECORDS_REVIEW_DETAIL_SIGNED_RECORDS_LINK,
    peerLink: SIGNED_RECORDS_REVIEW_DETAIL_REVIEW_DETAIL_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildSignedRecordsReviewDetailVocabulary(): SignedRecordsReviewDetailVocabularyModel {
  const rail = buildSignedRecordsReviewDetailPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    signedRecordsLink: rail.currentLink,
    reviewDetailLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveSignedRecordsReviewDetailPeerLink(
  currentSurfaceId: SignedRecordsReviewDetailSurfaceId,
): SignedRecordsReviewDetailLink {
  if (currentSurfaceId === "signed-records") {
    return SIGNED_RECORDS_REVIEW_DETAIL_REVIEW_DETAIL_LINK;
  }

  return SIGNED_RECORDS_REVIEW_DETAIL_SIGNED_RECORDS_LINK;
}
