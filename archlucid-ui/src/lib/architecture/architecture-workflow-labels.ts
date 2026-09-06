/**
 * Canonical labels for architecture creation (`/architectures/*`) and review intake (`/architecture/reviews/new`).
 * Single source for sidebar, route titles, breadcrumbs, hub CTAs, and empty states.
 */
export const CREATE_ARCHITECTURE_LABEL = "Create architecture" as const;

/** Explicit create action on the Create architecture entry page (page title stays Create architecture). */
export const START_NEW_ARCHITECTURE_LABEL = "Start new architecture" as const;

/** Primary resume action for a saved architecture draft. */
export const CONTINUE_DRAFT_LABEL = "Continue draft" as const;

/** Secondary link to the architecture draft inventory. */
export const VIEW_ALL_DRAFTS_LABEL = "View all drafts" as const;

/** Guided-mode sidebar label for `/architecture/architectures` draft-inventory teaching list. */
export const ARCHITECTURE_DRAFTS_LIST_LABEL = "Architectures" as const;

/** Working-mode sidebar label for `/architecture/architectures` identity portfolio (CA-32). */
export const ARCHITECTURE_IDENTITIES_NAV_LABEL = "Architectures" as const;

/** Secondary nav label when draft inventory remains reachable beside identities (CA-32). */
export const ARCHITECTURE_DRAFTS_NAV_LABEL = "Drafts" as const;

/** Left-nav and review-intake entry for starting an architecture review. */
export const START_REVIEW_LABEL = "Start review" as const;

/** Working-mode single start verb — dense draft editor (`ARCHITECTURES_NEW_PATH`). */
export const WORKING_NEW_REVIEW_LABEL = "New review" as const;
