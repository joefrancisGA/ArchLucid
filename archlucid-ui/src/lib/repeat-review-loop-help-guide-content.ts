export const REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE = "Your repeat architecture review";

export const REPEAT_REVIEW_LOOP_HELP_LAST_REVIEWED = "2026-07-27" as const;

export const REPEAT_REVIEW_LOOP_HELP_AUDIENCE =
  "Audience: Architects and architecture leads after the first finalized architecture package.";

export const REPEAT_REVIEW_LOOP_HELP_PREREQUISITE_DETAIL =
  "Prerequisite: One successful Core Pilot finalize.";

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
  "After one committed architecture review, ArchLucid helps you compare packages, replay authority for regressions, run governance dry-runs, and collect sponsor-safe proof on follow-up reviews.";

export const REPEAT_REVIEW_LOOP_HELP_DIAGRAM_SUMMARY =
  "The repeat-review loop after your first finalize: compare, replay, dry-run governance, finalize again, and collect proof. See [Compare and replay](/help/comparison-replay) and [Your first architecture review](/help/first-architecture-review) for step detail.";

/** Buyer-safe repeat-review cycle — no CLI scripts or repo paths. */
export const REPEAT_REVIEW_LOOP_HELP_DIAGRAM_SOURCE = `flowchart LR
  FF[First finalize] --> CMP[Compare two reviews]
  CMP --> RPL[Replay regressions]
  RPL --> DD[Governance dry-run]
  DD --> SF[Second finalize]
  SF --> PRF[Collect sponsor-safe proof]
  PRF -.->|Next cycle| CMP`;

export const REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS = {
  compareReviews: {
    label: "Compare two reviews",
    href: "/insights/compare-two-reviews",
  },
  startNextReview: {
    label: "Start next review",
    href: "/architecture/reviews/new",
  },
  firstArchitectureReview: {
    label: "Your first architecture review",
    href: "/help/first-architecture-review",
  },
} as const;
