/** Draft-detail page subtitle lead — drafting scope + draft≠review boundary (TB-1454). */
export const ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE =
  "Drafting workspace — editing or saving does not start a review.";

/** Bold scan label for required refine guidance — pair with {@link ARCHITECTURE_DRAFT_REFINE_REQUIRED_BEFORE_REVIEW_BODY}. */
export const ARCHITECTURE_DRAFT_REFINE_REQUIRED_BEFORE_REVIEW_LABEL = "Required before review" as const;

/** Body copy after the required refine guidance label. */
export const ARCHITECTURE_DRAFT_REFINE_REQUIRED_BEFORE_REVIEW_BODY =
  "complete the system name, architecture overview, business outcome, and at least one confirmed person or system in this draft." as const;

/** Draft still missing required review-readiness fields — refinement is required, not optional. */
export const ARCHITECTURE_DRAFT_REFINE_REQUIRED_BEFORE_REVIEW_SENTENCE =
  `${ARCHITECTURE_DRAFT_REFINE_REQUIRED_BEFORE_REVIEW_LABEL}: ${ARCHITECTURE_DRAFT_REFINE_REQUIRED_BEFORE_REVIEW_BODY}` as const;

/** Buyer-polished draft detail lead — autosave behavior after refine guidance. */
export const ARCHITECTURE_DRAFT_AUTOSAVE_LOCAL_ONLY_SENTENCE =
  "Unsaved typing is kept on this browser until your first save.";

/** After a server draft id exists, typing syncs to the signed-in account. */
export const ARCHITECTURE_DRAFT_AUTOSAVE_ACCOUNT_SENTENCE =
  "Saved to your account; changes sync where you sign in.";

/**
 * @deprecated Prefer {@link resolveArchitectureDraftAutosaveSentence} for readiness-aware autosave copy.
 */
export const ARCHITECTURE_DRAFT_DETAIL_AUTOSAVE_SENTENCE =
  ARCHITECTURE_DRAFT_AUTOSAVE_LOCAL_ONLY_SENTENCE;

export function resolveArchitectureDraftAutosaveSentence(hasServerDraftId: boolean): string {
  if (hasServerDraftId) {
    return ARCHITECTURE_DRAFT_AUTOSAVE_ACCOUNT_SENTENCE;
  }

  return ARCHITECTURE_DRAFT_AUTOSAVE_LOCAL_ONLY_SENTENCE;
}

/** Draft meets minimum review-readiness — further refinement is optional. */
export const ARCHITECTURE_DRAFT_REFINE_OPTIONAL_BEFORE_REVIEW_SENTENCE =
  "You can start a review now, or keep refining this draft if you want." as const;

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
  hasServerDraftId = false,
): string {
  return `${ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE} ${resolveArchitectureDraftRefineGuidanceSentence(reviewReadinessValid)} ${resolveArchitectureDraftAutosaveSentence(hasServerDraftId)}`;
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
  hasServerDraftId = false,
): string {
  if (buyerPolishedShell) {
    return resolveArchitectureDraftDetailPageSubtitleBuyer(reviewReadinessValid, hasServerDraftId);
  }

  return ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_OPERATOR;
}

export const ARCHITECTURE_DRAFT_DETAIL_LOAD_RETRY_LABEL = "Retry loading draft";

export const ARCHITECTURE_DRAFT_DETAIL_BREADCRUMB_FALLBACK_LABEL = "Architecture draft";
