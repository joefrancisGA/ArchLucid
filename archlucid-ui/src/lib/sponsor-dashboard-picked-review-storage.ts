export const SPONSOR_DASHBOARD_PICKED_REVIEW_STORAGE_KEY = "archlucid_sponsor_dashboard_picked_review_v1";

export function readSponsorDashboardPickedReviewId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(SPONSOR_DASHBOARD_PICKED_REVIEW_STORAGE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function writeSponsorDashboardPickedReviewId(reviewId: string): void {
  const trimmed = reviewId.trim();

  if (trimmed.length === 0) {
    return;
  }

  try {
    window.localStorage.setItem(SPONSOR_DASHBOARD_PICKED_REVIEW_STORAGE_KEY, trimmed);
  } catch {
    /* ignore quota / private-mode failures */
  }
}
