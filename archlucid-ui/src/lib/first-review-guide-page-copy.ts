export const FIRST_REVIEW_GUIDE_PRIMARY_CONTENT_ID = "first-review-guide-primary-content" as const;

export const FIRST_REVIEW_GUIDE_FIRST_VIEWPORT_ID = "first-review-guide-first-viewport" as const;

export const FIRST_REVIEW_GUIDE_FIRST_VIEWPORT_TEST_ID = FIRST_REVIEW_GUIDE_FIRST_VIEWPORT_ID;

export const FIRST_REVIEW_GUIDE_SKIP_TARGET_ID = FIRST_REVIEW_GUIDE_FIRST_VIEWPORT_ID;

export const FIRST_REVIEW_GUIDE_SKIP_LINK_LABEL = "Skip to first review checklist" as const;

/** Shown when a single prerequisite still blocks progress (sample or policy pack). */
export const FIRST_REVIEW_GUIDE_ONE_PREREQUISITE_SECTION_TITLE = "One next prerequisite" as const;

/** Shown when sample package and policy pack are already selected — section explains checklist continuation. */
export const FIRST_REVIEW_GUIDE_PREREQUISITES_COMPLETE_SECTION_TITLE = "Next steps" as const;

/**
 * Body copy when the workspace sample and policy selections are satisfied.
 * Keeps momentum: prerequisites are done; the checklist below is the authoritative path.
 */
export const FIRST_REVIEW_GUIDE_PREREQUISITES_COMPLETE_BODY =
  "Sample package and policy pack are selected. Use Start first review (or your next checklist step below) to move from setup into intake and findings." as const;
