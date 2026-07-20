/**
 * Canonical labels for architecture creation (`/architectures/*`) and review intake (`/reviews/new`).
 * Single source for sidebar, route titles, breadcrumbs, hub CTAs, and empty states.
 */
export const CREATE_ARCHITECTURE_LABEL = "Create architecture" as const;

/** Explicit create action on the Create architecture entry page (page title stays Create architecture). */
export const START_NEW_ARCHITECTURE_LABEL = "Start new architecture" as const;

/** Primary resume action for a saved architecture draft. */
export const CONTINUE_DRAFT_LABEL = "Continue draft" as const;

/** Secondary link to the architecture draft inventory. */
export const VIEW_ALL_DRAFTS_LABEL = "View all drafts" as const;

/** Breadcrumb and inventory label for `/architectures` — matches page title and Architecture nav. */
export const ARCHITECTURE_DRAFTS_LIST_LABEL = "Architectures" as const;

/** Resume affordance on architecture-creation bootstrap and draft cards. */
export const CONTINUE_DRAFT_LABEL = "Continue draft" as const;

/** Explicit start-new action when saved drafts already exist (`/architectures/new`). */
export const START_NEW_ARCHITECTURE_LABEL = "Start new architecture" as const;

/** Link to the full drafts inventory from creation bootstrap surfaces. */
export const VIEW_ALL_DRAFTS_LABEL = "View all drafts" as const;

/** Left-nav and review-intake entry for starting an architecture review. */
export const START_REVIEW_LABEL = "Start review" as const;
