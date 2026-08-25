export const PLANNING_PICKED_REVIEW_STORAGE_KEY = "archlucid_planning_picked_review_v1";

export function readPlanningPickedReviewId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(PLANNING_PICKED_REVIEW_STORAGE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function writePlanningPickedReviewId(reviewId: string): void {
  const trimmed = reviewId.trim();

  if (trimmed.length === 0) {
    return;
  }

  try {
    window.localStorage.setItem(PLANNING_PICKED_REVIEW_STORAGE_KEY, trimmed);
  } catch {
    /* ignore quota / private-mode failures */
  }
}
