/**
 * Source of truth for signed-record when-to-share occasions (TB-2243).
 * Distinct from share-link permission clarity (TB-2212) — this answers *when*
 * to use share link vs print vs export, not what a created link allows.
 */

import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";

export type ReviewPackageShareWhenToShareRowId = "shareLink" | "print" | "export";

export type ReviewPackageShareWhenToShareRow = {
  readonly id: ReviewPackageShareWhenToShareRowId;
  readonly label: string;
  readonly occasion: string;
};

export type ReviewPackageShareWhenToSharePreview = {
  readonly title: string;
  readonly summary: string;
  readonly rows: readonly ReviewPackageShareWhenToShareRow[];
};

export const REVIEW_PACKAGE_SHARE_WHEN_TO_SHARE_TITLE = "When to share this finalized review record" as const;

const ROW_IDS: readonly ReviewPackageShareWhenToShareRowId[] = [
  "shareLink",
  "print",
  "export",
] as const;

/** Stable when-to-share matrix for the review-package share row. */
export function buildReviewPackageShareWhenToSharePreview(): ReviewPackageShareWhenToSharePreview {
  const sealedReviewRecord = BUYER_SURFACE_VOCABULARY.sealedReviewRecord;

  return {
    title: REVIEW_PACKAGE_SHARE_WHEN_TO_SHARE_TITLE,
    summary: `Choose how to hand off this ${sealedReviewRecord.toLowerCase()} — a URL, a printable summary, or an operator deliverable export.`,
    rows: [
      {
        id: "shareLink",
        label: "Share link",
        occasion:
          "Use when a reader needs a read-only URL to open the package showcase without an ArchLucid invite.",
      },
      {
        id: "print",
        label: "Print / Save as PDF",
        occasion:
          "Use when you need a clean package summary for a meeting or binder — not a signed export artifact.",
      },
      {
        id: "export",
        label: "Export deliverable",
        occasion:
          "Use when sponsors or auditors need a formal deliverable from the sealed review record (ADR, packet, or similar).",
      },
    ],
  };
}

export function reviewPackageShareWhenToShareRowById(
  id: ReviewPackageShareWhenToShareRowId,
): ReviewPackageShareWhenToShareRow {
  const preview = buildReviewPackageShareWhenToSharePreview();
  const row = preview.rows.find((candidate) => candidate.id === id);

  if (row === undefined) {
    throw new Error(`Missing review-package share when-to-share row: ${id}`);
  }

  return row;
}

/** Guard for tests - matrix must cover every declared row id exactly once. */
export function assertReviewPackageShareWhenToShareMatrixComplete(): void {
  const ids = buildReviewPackageShareWhenToSharePreview().rows.map((row) => row.id);

  for (const expected of ROW_IDS) {
    if (!ids.includes(expected)) {
      throw new Error(`Review-package share when-to-share matrix missing row: ${expected}`);
    }
  }

  if (ids.length !== ROW_IDS.length) {
    throw new Error("Review-package share when-to-share matrix has unexpected row count.");
  }
}
