export const REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE = "Repeat-review stickiness loop";

export const REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE =
  "After the first finalized architecture review: compare, replay, governance dry-runs, and second-review proof checklist.";

export const REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE_BUYER =
  "Compare, replay, and prove value after your first finalized review.";

export const REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE_OPERATOR = REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE;

export function repeatReviewLoopHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE_BUYER
    : REPEAT_REVIEW_LOOP_HELP_PAGE_SUBTITLE_OPERATOR;
}

export const REPEAT_REVIEW_LOOP_HELP_LAST_REFRESHED_PREFIX = "Last refreshed" as const;

export const REPEAT_REVIEW_LOOP_HELP_ACTION_REFRESH = "Refresh" as const;

export const REPEAT_REVIEW_LOOP_HELP_ACTION_REFRESHING = "Refreshing…" as const;

export const REPEAT_REVIEW_LOOP_HELP_SCOPE_DETAILS_TRIGGER = "About repeat reviews" as const;

export const REPEAT_REVIEW_LOOP_HELP_OVERVIEW =
  "After one committed architecture review, ArchLucid helps you show stickiness: compare packages, replay authority for regressions, run governance dry-runs, and collect sponsor-safe proof on follow-up reviews.";

export const REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS = {
  compareReviews: {
    label: "Compare two reviews",
    href: "/insights/compare-two-reviews",
  },
  startNextReview: {
    label: "Start next review",
    href: "/reviews/new",
  },
  firstArchitectureReview: {
    label: "Your first architecture review",
    href: "/help/first-architecture-review",
  },
} as const;
