/**
 * TB-747 — differentiate review intake (evidence-first) from architecture creation (drafting-first).
 * Review paths live under `/architecture/reviews/new`; create paths under `/architectures/**`.
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
  "Start a new architecture or continue one of your saved drafts.";

/** Empty-state guidance when the operator has no saved drafts yet. */
export const ARCHITECTURE_CREATION_NO_DRAFTS_GUIDANCE =
  "Describe the system, goals, and constraints to begin your first architecture.";

/** Concise create≠review boundary — not a warning banner. */
export const ARCHITECTURE_CREATION_REVIEW_BOUNDARY =
  "Creating or saving an architecture does not start a review.";

/** Restrained autosave reassurance — only show where draft autosave is real. */
export const ARCHITECTURE_CREATION_AUTOSAVE_REASSURANCE = "Architecture drafts are saved automatically.";

/** Section label when a single recent draft is offered for resume. */
export const ARCHITECTURE_CREATION_CONTINUE_SECTION_TITLE = "Continue a draft";

/** Section label when several recent drafts are previewed. */
export const ARCHITECTURE_CREATION_RECENT_DRAFTS_SECTION_TITLE = "Recent drafts";

/** Optional alternatives framing on the create path (not required to save). */
export const ARCHITECTURE_DRAFT_ALTERNATIVES_HINT =
  "Note alternatives or rejected options you considered — even brief tradeoff notes help reviewers understand your intent.";
