export const ROI_SUMMARY_PICKED_REVIEW_STORAGE_KEY = "archlucid_roi_summary_picked_review_v1";

export function readRoiSummaryPickedReviewId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(ROI_SUMMARY_PICKED_REVIEW_STORAGE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function writeRoiSummaryPickedReviewId(reviewId: string): void {
  const trimmed = reviewId.trim();

  if (trimmed.length === 0) {
    return;
  }

  try {
    window.localStorage.setItem(ROI_SUMMARY_PICKED_REVIEW_STORAGE_KEY, trimmed);
  } catch {
    /* ignore */
  }
}
