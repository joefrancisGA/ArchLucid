export const SPONSOR_REPORT_PICKED_REVIEW_STORAGE_KEY = "archlucid_sponsor_report_picked_review_v1";

export function readSponsorReportPickedReviewId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(SPONSOR_REPORT_PICKED_REVIEW_STORAGE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function writeSponsorReportPickedReviewId(reviewId: string): void {
  const trimmed = reviewId.trim();

  if (trimmed.length === 0) {
    return;
  }

  try {
    window.localStorage.setItem(SPONSOR_REPORT_PICKED_REVIEW_STORAGE_KEY, trimmed);
  } catch {
    /* ignore */
  }
}
