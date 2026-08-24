/** Draft-detail page subtitle lead — drafting scope + draft≠review boundary (TB-1454). */
export const ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE =
  "Drafting workspace — editing or saving does not start a review.";

/** Shared refine-before-review bridge on draft detail and operator home draft hero. */
export const ARCHITECTURE_DRAFT_REFINE_BEFORE_REVIEW_SENTENCE =
  "Refine this architecture draft before starting a review." as const;

export const ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_BUYER =
  `${ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE} ${ARCHITECTURE_DRAFT_REFINE_BEFORE_REVIEW_SENTENCE} Autosave keeps unsaved typing on this browser; saved drafts sync where you sign in.`;

/** Operator draft-detail subtitle — not shared with `/architectures/new` (uses {@link ARCHITECTURE_DRAFT_WORKSPACE_LEAD}). */
export const ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_OPERATOR =
  `${ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE} Describe the system, the outcome it must deliver, and the people and systems it touches. Save and return anytime to keep refining.`;

export function architectureDraftDetailPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_BUYER
    : ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_OPERATOR;
}

export const ARCHITECTURE_DRAFT_DETAIL_LOAD_RETRY_LABEL = "Retry loading draft";

export const ARCHITECTURE_DRAFT_DETAIL_BREADCRUMB_FALLBACK_LABEL = "Architecture draft";
