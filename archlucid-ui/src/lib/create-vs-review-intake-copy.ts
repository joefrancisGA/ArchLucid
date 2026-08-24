/**
 * TB-747 — differentiate review intake (evidence-first) from architecture creation (drafting-first).
 * Review paths live under `/architecture/reviews/new`; create paths under `/architectures/**`.
 */

/**
 * Quick-review intake lead — evidence preferred, context-only path allowed. Sits on the form card itself:
 * the page lead already covers cloud-optional framing, so this states only the evidence-or-context rule.
 */
export const REVIEW_INTAKE_EVIDENCE_FIRST_PROGRESS_LEAD =
  "Attach a diagram or document when you have one, or describe the architecture in enough detail if you are not uploading files.";

/**
 * Architecture draft workspace — iterative brief before review handoff (TB-1454: draft≠review boundary
 * lives in guidance disclosure only). Names only what the draft form actually asks for: system name and
 * architecture overview, business outcome, and people/systems. Do not promise fields the form omits.
 */
export const ARCHITECTURE_DRAFT_WORKSPACE_LEAD =
  "Describe the system, the outcome it must deliver, and the people and systems it touches. Save and return anytime to keep refining.";

/** `/architectures/new` page subtitle — subordinate to H1 {@link CREATE_ARCHITECTURE_LABEL} (TB-1461). */
export const ARCHITECTURE_CREATION_PAGE_SUBTITLE =
  "Describe the system, the outcome it must deliver, and the people and systems it touches. Start a new draft below — autosave keeps unsaved typing on this browser; saved drafts sync where you sign in.";

/** `/architectures/new` page subtitle when browser-local drafts exist (TB-1462). */
export const ARCHITECTURE_CREATION_PAGE_SUBTITLE_WITH_DRAFTS =
  "Continue a saved draft below, or describe a new system — outcome, people, and systems it touches. Autosave keeps unsaved typing on this browser; saved drafts sync where you sign in.";

/** Form section heading on `/architectures/new` before the draft is named or persisted (TB-1461). */
export const ARCHITECTURE_CREATION_NEW_DRAFT_SECTION_TITLE = "New architecture draft";

/** Empty-state guidance when the operator has no saved drafts yet (TB-1459). */
export const ARCHITECTURE_CREATION_NO_DRAFTS_GUIDANCE =
  "No drafts on this browser yet. Describe the system, goals, and constraints below to begin, then save to store your draft to your account.";

/** Resume strip body when local registry entries exist (TB-1459). */
export const ARCHITECTURE_CREATION_RECENT_DRAFTS_BODY =
  "Recently saved drafts on this browser. Saved drafts are stored to your account and sync across browsers where you sign in. Continue one below or browse the full list.";

/** Link to `/architectures` from the create path — aligned with architectures hub honesty (TB-1459). */
export const ARCHITECTURE_CREATION_VIEW_ALL_DRAFTS_LABEL = "View all saved drafts" as const;

/** Concise create≠review boundary — not a warning banner. */
export const ARCHITECTURE_CREATION_REVIEW_BOUNDARY =
  "Creating or saving an architecture does not start a review.";

/** Restrained autosave reassurance — only show where draft autosave is real. */
export const ARCHITECTURE_CREATION_AUTOSAVE_REASSURANCE =
  "Architecture drafts are saved automatically to your account.";

/** Section label when a single recent draft is offered for resume (TB-1461). */
export const ARCHITECTURE_CREATION_CONTINUE_SECTION_TITLE = "Resume an architecture draft";

/** Section label when several recent drafts are previewed (TB-1461). */
export const ARCHITECTURE_CREATION_RECENT_DRAFTS_SECTION_TITLE = "Resume architecture drafts";

/**
 * Optional alternatives framing on the create path (not required to save). Renders as persistent helper
 * text under Architecture overview rather than inside the dismissible guidance tip, so the tradeoff
 * prompt survives both a dismissed tip and an overview long enough to hide its character-count helper.
 */
export const ARCHITECTURE_DRAFT_ALTERNATIVES_HINT =
  "Note alternatives or rejected options you considered — even brief tradeoff notes help reviewers understand your intent.";
