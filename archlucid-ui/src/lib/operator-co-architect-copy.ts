/**
 * Umbrella positioning: "co-architect" is the role noun; "Workspace" may name the surface.
 * Avoid competing role words (co-pilot, assistant) in primary buyer copy — see assessment doc.
 */

export const OPERATOR_CO_ARCHITECT_BRAND_LINE = "ArchLucid — your AI co-architect.";

/** Persistent focus for analytics / future wizard branching; values are stored in localStorage. */
export const OPERATOR_CO_ARCHITECT_INTENT_STORAGE_KEY = "archlucid.operatorIntentFocus.v1";

export type OperatorCoArchitectIntentFocus = "review" | "describe";

export const OPERATOR_CO_ARCHITECT_HOME_STRIP_ARIA_LABEL =
  "AI co-architect entry paths — architecture review or describe what you want";

/** Review door is the V1 marketing lead on operator home; describe is an equal secondary route into the same wizard. */
export const OPERATOR_CO_ARCHITECT_HOME_STRIP_BODY =
  "Follow four steps: create an architecture review, let the pipeline finish, finalize when ready, then open your review package. Your co-architect refines inputs with questions until that package is coherent; loose notes use the same wizard with different emphasis.";

export const OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY = "Start architecture review";

export const OPERATOR_CO_ARCHITECT_CTA_DESCRIBE_SECONDARY = "Describe what you want";

export const OPERATOR_CO_ARCHITECT_CHECKLIST_KICKER =
  "Your AI co-architect walks you through questions and feedback until your first package is ready to review.";
