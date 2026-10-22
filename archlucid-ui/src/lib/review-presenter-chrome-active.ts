import { readPresenterModeFromWindowLocation } from "@/lib/review-detail-workspace-tabs";

/** True when Working presenter mode is active (`presenter=1` or html data attribute). */
export function isReviewPresenterChromeActive(): boolean {
  if (typeof document !== "undefined") {
    if (document.documentElement.getAttribute("data-review-presenter") === "1") {
      return true;
    }
  }

  return readPresenterModeFromWindowLocation();
}
