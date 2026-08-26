/** Draft-detail page subtitle lead — drafting scope + draft≠review boundary (TB-1454). */
export const ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE =
  "Drafting workspace — editing or saving does not start a review.";

/** Draft still missing required review-readiness fields — refinement is required, not optional. */
export const ARCHITECTURE_DRAFT_REFINE_REQUIRED_BEFORE_REVIEW_SENTENCE =
  "Required before review: complete the system name, architecture overview, business outcome, and at least one confirmed person or system in this draft." as const;

/** Draft meets minimum review-readiness — further refinement is optional. */
export const ARCHITECTURE_DRAFT_REFINE_OPTIONAL_BEFORE_REVIEW_SENTENCE =
  "Refining is optional. You can start a review when you are ready, or keep editing this draft first." as const;

/**
 * @deprecated Prefer {@link resolveArchitectureDraftRefineGuidanceSentence} — static copy implied refinement was always required.
 */
export const ARCHITECTURE_DRAFT_REFINE_BEFORE_REVIEW_SENTENCE =
  ARCHITECTURE_DRAFT_REFINE_REQUIRED_BEFORE_REVIEW_SENTENCE;

export function resolveArchitectureDraftRefineGuidanceSentence(
  reviewReadinessValid: boolean,
): string {
  if (reviewReadinessValid) {
    return ARCHITECTURE_DRAFT_REFINE_OPTIONAL_BEFORE_REVIEW_SENTENCE;
  }

  return ARCHITECTURE_DRAFT_REFINE_REQUIRED_BEFORE_REVIEW_SENTENCE;
}

export function resolveArchitectureDraftDetailPageSubtitleBuyer(
  reviewReadinessValid: boolean,
): string {
  return `${ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE} ${resolveArchitectureDraftRefineGuidanceSentence(reviewReadinessValid)} Autosave keeps unsaved typing on this browser; saved drafts sync where you sign in.`;
}

/** @deprecated Prefer {@link resolveArchitectureDraftDetailPageSubtitleBuyer} for readiness-aware buyer copy. */
export const ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_BUYER =
  resolveArchitectureDraftDetailPageSubtitleBuyer(false);

/** Operator draft-detail subtitle — not shared with `/architectures/new` (uses {@link ARCHITECTURE_DRAFT_WORKSPACE_LEAD}). */
export const ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_OPERATOR =
  `${ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE} Describe the system, the outcome it must deliver, and the people and systems it touches. Save and return anytime to keep refining.`;

export function architectureDraftDetailPageSubtitle(
  buyerPolishedShell: boolean,
  reviewReadinessValid = false,
): string {
  if (buyerPolishedShell) {
    return resolveArchitectureDraftDetailPageSubtitleBuyer(reviewReadinessValid);
  }

  return ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_OPERATOR;
}

export const ARCHITECTURE_DRAFT_DETAIL_LOAD_RETRY_LABEL = "Retry loading draft";

export const ARCHITECTURE_DRAFT_DETAIL_BREADCRUMB_FALLBACK_LABEL = "Architecture draft";
