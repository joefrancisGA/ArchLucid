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
  "Resume a saved architecture draft from this device, or start a new draft in the form below.";

/** `/architectures/new` page subtitle when browser-local drafts exist (TB-1462). */
export const ARCHITECTURE_CREATION_PAGE_SUBTITLE_WITH_DRAFTS =
  "Continue a saved architecture draft below, or start a new draft in the form when you are ready.";

/** Workspace lead on `/architectures/new` when browser-local drafts exist (TB-1462). */
export const ARCHITECTURE_CREATION_RESUME_FIRST_WORKSPACE_LEAD =
  "Your saved drafts are listed first. Continue one to pick up where you left off, or start a new architecture draft below.";

/** Form section heading on `/architectures/new` before the draft is named or persisted (TB-1461). */
export const ARCHITECTURE_CREATION_NEW_DRAFT_SECTION_TITLE = "New architecture draft";

/** Empty-state guidance when the operator has no saved drafts yet (TB-1459). */
export const ARCHITECTURE_CREATION_NO_DRAFTS_GUIDANCE =
  "No architecture drafts on this device yet. Describe the system, goals, and constraints below to begin. Drafts from other browsers or devices will not appear here.";

/** Resume strip body when local registry entries exist (TB-1459). */
export const ARCHITECTURE_CREATION_RECENT_DRAFTS_BODY =
  "These drafts stay on this device after you close the browser — not a shared tenant-wide inventory. Continue one below or browse the full list.";

/** Link to `/architectures` from the create path — aligned with architectures hub honesty (TB-1459). */
export const ARCHITECTURE_CREATION_VIEW_ALL_DRAFTS_LABEL = "View all drafts on this device" as const;

/** Concise create≠review boundary — not a warning banner. */
export const ARCHITECTURE_CREATION_REVIEW_BOUNDARY =
  "Creating or saving an architecture does not start a review.";

/** Restrained autosave reassurance — only show where draft autosave is real. */
export const ARCHITECTURE_CREATION_AUTOSAVE_REASSURANCE = "Architecture drafts are saved automatically.";

/** Browser session persistence for multi-step intake and admin wizards (TB-2157). */
export const WIZARD_SESSION_AUTOSAVE_REASSURANCE =
  "Your progress is saved in this browser while you work.";

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
