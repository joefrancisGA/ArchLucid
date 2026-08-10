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

/** Architecture draft workspace — iterative brief before review handoff. */
export const ARCHITECTURE_DRAFT_WORKSPACE_LEAD =
  "Draft goals, constraints, and tradeoffs before you file evidence for review. Save and refine this brief anytime — nothing starts a review until you choose to.";

/** `/architectures/new` page subtitle — subordinate to H1 {@link CREATE_ARCHITECTURE_LABEL} (TB-1461). */
export const ARCHITECTURE_CREATION_PAGE_SUBTITLE =
  "Resume a saved architecture draft from this browser, or start a new draft in the form below.";

/** Form section heading on `/architectures/new` before the draft is named or persisted (TB-1461). */
export const ARCHITECTURE_CREATION_NEW_DRAFT_SECTION_TITLE = "New architecture draft";

/** Empty-state guidance when the operator has no saved drafts yet (TB-1459). */
export const ARCHITECTURE_CREATION_NO_DRAFTS_GUIDANCE =
  "No architecture drafts are saved in this browser yet. Describe the system, goals, and constraints below to begin. Drafts you save on other browsers or devices will not appear here.";

/** Resume strip body when local registry entries exist (TB-1459). */
export const ARCHITECTURE_CREATION_RECENT_DRAFTS_BODY =
  "These drafts are saved in this browser only — not a tenant-wide inventory. Continue one below or browse the full list on this device.";

/** Link to `/architectures` from the create path — aligned with architectures hub honesty (TB-1459). */
export const ARCHITECTURE_CREATION_VIEW_ALL_DRAFTS_LABEL = "View all drafts on this browser" as const;

/** Concise create≠review boundary — not a warning banner. */
export const ARCHITECTURE_CREATION_REVIEW_BOUNDARY =
  "Creating or saving an architecture does not start a review.";

/** Restrained autosave reassurance — only show where draft autosave is real. */
export const ARCHITECTURE_CREATION_AUTOSAVE_REASSURANCE = "Architecture drafts are saved automatically.";

/** Section label when a single recent draft is offered for resume (TB-1461). */
export const ARCHITECTURE_CREATION_CONTINUE_SECTION_TITLE = "Resume an architecture draft";

/** Section label when several recent drafts are previewed (TB-1461). */
export const ARCHITECTURE_CREATION_RECENT_DRAFTS_SECTION_TITLE = "Resume architecture drafts";

/** Optional alternatives framing on the create path (not required to save). */
export const ARCHITECTURE_DRAFT_ALTERNATIVES_HINT =
  "Note alternatives or rejected options you considered — even brief tradeoff notes help reviewers understand your intent.";
