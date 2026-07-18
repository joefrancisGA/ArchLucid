/**
 * TB-747 — differentiate review intake (evidence-first) from architecture creation (drafting-first).
 * Review paths live under `/reviews/new`; create paths under `/architectures/**`.
 */

/** Quick-review progress header — evidence before optional brief. */
export const REVIEW_INTAKE_EVIDENCE_FIRST_PROGRESS_TITLE = "Start from architecture evidence";

export const REVIEW_INTAKE_EVIDENCE_FIRST_PROGRESS_LEAD =
  "Upload a diagram or document, then add context. Evidence drives the review — cloud connection stays optional.";

/** Architecture draft workspace — iterative brief before review handoff. */
export const ARCHITECTURE_DRAFT_WORKSPACE_LEAD =
  "Draft goals, constraints, and tradeoffs before you file evidence for review. Save and refine this brief anytime — nothing starts a review until you choose to.";

/** `/architectures/new` bootstrap page — drafting-first entry. */
export const ARCHITECTURE_CREATION_BOOTSTRAP_LEAD =
  "Build a clear architecture brief before you attach evidence or start a review.";

/** Optional alternatives framing on the create path (not required to save). */
export const ARCHITECTURE_DRAFT_ALTERNATIVES_HINT =
  "Note alternatives or rejected options you considered — even brief tradeoff notes help reviewers understand your intent.";
