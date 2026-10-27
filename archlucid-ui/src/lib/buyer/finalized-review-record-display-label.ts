import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { deriveSignedReviewRecordIdLabel } from "@/lib/run-detail-workspace-derive/review-metadata";
import {
  SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
  SHOWCASE_BUYER_REVIEW_TITLE,
} from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

export type FinalizedReviewRecordDisplayLabelOptions = {
  /** Card headline — when it matches the showcase review title, prefer the package title for the record link. */
  readonly cardTitle?: string;
};

/**
 * Buyer-facing label for a finalized review record on summary surfaces.
 * Keeps manifest id as technical identity; this is display text only.
 */
export function finalizedReviewRecordDisplayLabel(
  run: RunSummary,
  manifestId: string | null | undefined,
  options?: FinalizedReviewRecordDisplayLabelOptions,
): string {
  const runId = run.runId ?? "";

  if (isShowcaseStaticDemoRunId(runId)) {
    const headline = (options?.cardTitle ?? buyerFacingReviewTitleFromSummary(run)).trim();

    if (headline === SHOWCASE_BUYER_REVIEW_TITLE) {
      return SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE;
    }

    return SHOWCASE_BUYER_REVIEW_TITLE;
  }

  const buyerTitle = buyerFacingReviewTitleFromSummary(run).trim();

  const hasStoredBuyerTitle =
    buyerTitle.length > 0 &&
    buyerTitle !== "Untitled review" &&
    buyerTitle !== "Review title was not stored." &&
    buyerTitle !== "Review description was not stored.";

  if (hasStoredBuyerTitle) {
    return buyerTitle;
  }

  const truncated = deriveSignedReviewRecordIdLabel(manifestId);

  if (truncated !== null) {
    return truncated;
  }

  const trimmedManifestId = (manifestId ?? "").trim();

  if (trimmedManifestId.length > 0) {
    return trimmedManifestId;
  }

  return hasStoredBuyerTitle ? "Manifest id not recorded" : "Review title was not stored.";
}
