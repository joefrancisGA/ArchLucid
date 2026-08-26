import type { ReviewsNewPathMode } from "@/lib/reviews-new-path-copy";
import { findVisibleReviewsNewPageLevelResumeSession } from "@/lib/reviews-new-wizard-session-resume";

export function resolveReviewsNewPathModeFromQuery(pathQuery: string): ReviewsNewPathMode | null {
  if (pathQuery === "detailed" || pathQuery === "guided-intake" || pathQuery === "quick-review") {
    return pathQuery;
  }

  return null;
}

/** Buyer-polished detailed/guided tabs hide hub chrome including the resume strip. */
export function reviewsNewShowsPathTabChrome(
  buyerPolishedShell: boolean,
  activePath: ReviewsNewPathMode | null,
): boolean {
  return buyerPolishedShell && activePath !== null && activePath !== "quick-review";
}

/** Whether the hub-level resume strip should render for this surface. */
export function shouldShowReviewsNewPageLevelResumeHero(
  buyerPolishedShell: boolean,
  pathQuery: string,
): boolean {
  const activePath = resolveReviewsNewPathModeFromQuery(pathQuery.trim());
  const onPathTab = reviewsNewShowsPathTabChrome(buyerPolishedShell, activePath);

  if (onPathTab) {
    return false;
  }

  return findVisibleReviewsNewPageLevelResumeSession() !== null;
}

/**
 * Wizards on `/architecture/reviews/new` defer their inline resume prompt when the hub strip
 * already owns the single page-level resume hero.
 */
export function shouldSuppressWizardSessionResumePromptOnReviewsNew(
  buyerPolishedShell: boolean,
  pathQuery: string,
): boolean {
  return shouldShowReviewsNewPageLevelResumeHero(buyerPolishedShell, pathQuery);
}
