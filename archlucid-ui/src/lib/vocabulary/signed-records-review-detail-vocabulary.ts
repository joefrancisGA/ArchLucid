/**
 * TB-2272 — Signed review records ≠ review detail vocabulary rail.
 *
 * Why two surfaces exist:
 * - Signed review records (`/governance/signed-records`) is the *inventory* of
 *   finalized signed review records for diligence and governance follow-up.
 * - Review detail (`/architecture/reviews/[runId]`) is the *architecture
 *   package* workspace for one review — findings, evidence, and finalize.
 *
 * They stay separate because browsing signed records is not the same task as
 * working inside one architecture package. Open the peer when you need both.
 */

import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

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
  "Signed review records and review detail serve different purposes" as const;

export const SIGNED_RECORDS_REVIEW_DETAIL_WHY_TWO =
  "Signed review records is the inventory of finalized signed review records for diligence and governance follow-up. Review detail is the architecture package workspace for one review — findings, evidence, and finalize. The inventory is not the package workspace." as const;

export const SIGNED_RECORDS_REVIEW_DETAIL_COMPACT_LINE =
  "Signed review records lists finalized records; review detail is one architecture package — open the other when you need both." as const;

export const SIGNED_RECORDS_REVIEW_DETAIL_SIGNED_RECORDS_LINK: SignedRecordsReviewDetailLink = {
  id: "signed-records",
  label: "Signed review records",
  href: SIGNED_RECORDS_LIST_PATH,
  whenToUse: "Browse finalized signed review records for diligence and governance follow-up.",
};

/** Review detail is per-package; href uses the reviews hub as the stable peer home. */
export const SIGNED_RECORDS_REVIEW_DETAIL_REVIEW_DETAIL_LINK: SignedRecordsReviewDetailLink = {
  id: "review-detail",
  label: "Review detail",
  href: REVIEWS_LIST_PATH,
  whenToUse: "Open an architecture package workspace for findings, evidence, and finalize.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildSignedRecordsReviewDetailVocabulary(): SignedRecordsReviewDetailVocabularyModel {
  return {
    heading: SIGNED_RECORDS_REVIEW_DETAIL_HEADING,
    whyTwo: SIGNED_RECORDS_REVIEW_DETAIL_WHY_TWO,
    compactLine: SIGNED_RECORDS_REVIEW_DETAIL_COMPACT_LINE,
    signedRecordsLink: SIGNED_RECORDS_REVIEW_DETAIL_SIGNED_RECORDS_LINK,
    reviewDetailLink: SIGNED_RECORDS_REVIEW_DETAIL_REVIEW_DETAIL_LINK,
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
