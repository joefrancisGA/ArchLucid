/** Which intake field a scope row came from. Drives the row's static label and its edit behavior. */
import {
  GUIDED_INTAKE_ARCHITECTURE_CONTEXT_LABEL,
  GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_LABEL,
  GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL,
  GUIDED_INTAKE_ACTORS_SECTION_HEADING,
} from "@/lib/guided-intake-copy";

export type ScopeUnderstandingBulletKind =
  | "system"
  | "outcome"
  | "context"
  | "people"
  | "systems"
  | "gap"
  | "custom"
  | "fallback";

export type ScopeUnderstandingBullet = {
  readonly id: string;
  readonly kind: ScopeUnderstandingBulletKind;
  /** Static prefix naming the field this row mirrors. Never operator-editable — it is not free text. */
  readonly label: string;
  /** The operator-editable part of the row (empty label rows render the value alone). */
  readonly value: string;
  readonly source: "inferred" | "user";
};

export type DeriveScopeUnderstandingBulletsInput = {
  readonly architectureName?: string;
  readonly businessOutcome?: string;
  readonly architectureOverview?: string;
  readonly systemName?: string;
  readonly intentText?: string;
  readonly peopleAndSystems?: readonly ScopeActorInput[];
  readonly missingItemLabels?: readonly string[];
};

/** Actor row mirrored into the People / Systems scope lines. */
export type ScopeActorInput = {
  readonly label?: string;
  readonly kind: string;
  readonly trustOrigin?: string;
  readonly contract?: string;
};

export type ScopeUnderstandingBulletBehavior = {
  /** False when the underlying field is edited elsewhere on the page, so this row is display-only. */
  readonly editable: boolean;
  /** False for rows mirrored from required intake fields — operators may edit values, not delete the row. */
  readonly removable: boolean;
  /** False when merging the row would duplicate text the brief already carries, or is not operator scope. */
  readonly includeInBrief: boolean;
  readonly label: string;
};

/** Visible region label on the bordered scope panel — ties the box to architecture brief language used elsewhere on intake surfaces. */
export const SCOPE_UNDERSTANDING_BRIEF_REGION_LABEL = "Architecture brief";
export const SCOPE_UNDERSTANDING_HEADING = "What ArchLucid will treat as in-scope";
export const SCOPE_UNDERSTANDING_HELPER =
  "Edit these lines or add your own, then confirm. Confirmed scope is saved into the intake brief the reviewer reads.";
export const SCOPE_UNDERSTANDING_ADD_LABEL = "Add an in-scope item";
export const SCOPE_UNDERSTANDING_ADD_PLACEHOLDER =
  "Type a system, constraint, or boundary, then choose Add to scope (or press Enter)";
export const SCOPE_UNDERSTANDING_ADD_BUTTON_LABEL = "Add to scope";
export const SCOPE_UNDERSTANDING_ADD_EFFECT_HINT =
  "Items you add become scope lines in the intake brief — write each one the way you would state the boundary to a reviewer.";
/** Default pointer to the field that owns the architecture context text on the architecture draft page. */
export const SCOPE_CONTEXT_SOURCE_DEFAULT_LABEL = `${GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_LABEL} above`;
/** Default pointer to the actor editor that owns people and systems on the architecture draft page. */
export const SCOPE_ACTORS_SOURCE_DEFAULT_LABEL = `${GUIDED_INTAKE_ACTORS_SECTION_HEADING} above`;

export function scopeReadOnlyHint(contextSourceLabel: string): string {
  return `Read-only preview — edit this in ${contextSourceLabel}.`;
}

export const SCOPE_UNDERSTANDING_READ_ONLY_HINT = scopeReadOnlyHint(
  SCOPE_CONTEXT_SOURCE_DEFAULT_LABEL,
);
export const SCOPE_UNDERSTANDING_CONFIRM_LABEL = "Confirm scope";
export const SCOPE_UNDERSTANDING_CONFIRMED_STATUS_LABEL = "Scope confirmed";
export const SCOPE_UNDERSTANDING_EDIT_SCOPE_LABEL = "Edit scope";
/** Shown near Confirm scope when only placeholder guidance is present (TB-2005). */
export const SCOPE_UNDERSTANDING_CONFIRM_BLOCKED_HINT =
  "Add at least one in-scope item from the brief above before confirming scope.";
export const SCOPE_UNDERSTANDING_SECTION_HEADER = "Operator-confirmed in-scope understanding";
/** Ready line for surfaces where confirming scope is the last step before the review starts. */
export const SCOPE_UNDERSTANDING_READY_HINT = "You can start the review.";
export const SCOPE_UNDERSTANDING_SAVE_ERROR_HINT =
  "Scope is confirmed locally, but the draft could not be saved. Fix the errors above, then save again.";
export const SCOPE_UNDERSTANDING_SAVING_HINT = "Saving scope to draft…";
export const SCOPE_UNDERSTANDING_STALE_HINT =
  "Scope changed — re-confirm before starting a review.";
/** Ready line for wizards that confirm scope on an earlier step. */
export const SCOPE_UNDERSTANDING_READY_TO_CONTINUE_HINT = "You can continue.";

/** Quantifies what confirmation saved so the operator sees a concrete result. */
export function scopeConfirmedSummaryMessage(lineCount: number): string {
  const noun = lineCount === 1 ? "line" : "lines";

  return `${lineCount} scope ${noun} saved to the intake brief.`;
}

/** Preview length for the read-only context row. Display-only: the excerpt is never merged into the brief. */
export const SCOPE_CONTEXT_PREVIEW_MAX_LENGTH = 180;
export const SCOPE_ITEM_MIN_LENGTH = 3;
export const SCOPE_ITEM_MAX_LENGTH = 8000;

export const SCOPE_ITEM_TOO_SHORT_MESSAGE = `Add at least ${SCOPE_ITEM_MIN_LENGTH} characters so a reviewer can tell what this item covers.`;
export const SCOPE_ITEM_TOO_LONG_MESSAGE = `Keep an in-scope item under ${SCOPE_ITEM_MAX_LENGTH} characters — put longer detail in the architecture overview.`;
export const SCOPE_ITEM_NO_LETTER_MESSAGE =
  "Write the item in words — name a system, constraint, or boundary.";
export const SCOPE_ITEM_DUPLICATE_MESSAGE = "That item is already listed in scope.";

const SCOPE_BULLET_BEHAVIOR: Record<ScopeUnderstandingBulletKind, ScopeUnderstandingBulletBehavior> = {
  system: { editable: true, removable: false, includeInBrief: true, label: "Primary System or Architecture" },
  outcome: { editable: true, removable: false, includeInBrief: true, label: GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL },
  // The context row mirrors the architecture overview, which is the brief itself. Editing it here would
  // create a second source of truth, and merging it would append a truncated copy of the overview to the
  // overview. Both are avoided by keeping this row a read-only preview.
  context: { editable: false, removable: false, includeInBrief: false, label: GUIDED_INTAKE_ARCHITECTURE_CONTEXT_LABEL },
  // Mirrored from the actor editor — editing here would drift from the confirmed actor set above.
  people: { editable: false, removable: false, includeInBrief: true, label: "People in Scope" },
  systems: { editable: false, removable: false, includeInBrief: true, label: "Systems in Scope" },
  gap: { editable: true, removable: false, includeInBrief: true, label: "Out of scope until clarified" },
  custom: { editable: true, removable: true, includeInBrief: true, label: "Also in Scope" },
  // Placeholder copy shown when nothing has been entered yet — guidance, not operator-stated scope.
  fallback: { editable: false, removable: false, includeInBrief: false, label: "" },
};

export function scopeBulletBehavior(
  kind: ScopeUnderstandingBulletKind,
): ScopeUnderstandingBulletBehavior {
  return SCOPE_BULLET_BEHAVIOR[kind];
}

export function isScopeBulletEditable(kind: ScopeUnderstandingBulletKind): boolean {
  return scopeBulletBehavior(kind).editable;
}

export function isScopeBulletRemovable(kind: ScopeUnderstandingBulletKind): boolean {
  return scopeBulletBehavior(kind).removable;
}

/**
 * Removes a previously merged scope block from a brief field. Without this, a brief that already
 * carries the confirmed-scope section would feed that section back in as new bullet text.
 */
export function stripScopeUnderstandingSection(text: string | null | undefined): string {
  if (text === null || text === undefined) {
    return "";
  }

  const sectionIndex = text.indexOf(SCOPE_UNDERSTANDING_SECTION_HEADER);

  if (sectionIndex < 0) {
    return text;
  }

  return text.slice(0, sectionIndex).trimEnd();
}

export type ReconcileScopeUnderstandingBulletsInput = {
  readonly inferred: readonly ScopeUnderstandingBullet[];
  readonly previous: readonly ScopeUnderstandingBullet[];
  /** Rows the operator removed — they must not reappear when the form above is edited again. */
  readonly dismissedIds: readonly string[];
};

export type ScopeItemValidation =
  | { readonly status: "empty" }
  | { readonly status: "valid" }
  | { readonly status: "invalid"; readonly message: string };

export {
  actorScopeDisplayLabel,
  deriveScopeUnderstandingBullets,
  reconcileScopeUnderstandingBullets,
  scopeBulletText,
} from "./architecture-scope-understanding-derive";
export {
  canConfirmScopeUnderstanding,
  scopeBriefLines,
  validateScopeUnderstandingItem,
} from "./architecture-scope-understanding-validate";
export {
  extractScopeUnderstandingLinesFromBrief,
  mergeScopeBulletsIntoBrief,
  normalizeScopeUnderstandingBullets,
  persistedScopeMatchesBullets,
  scopeBulletsFingerprint,
  scopeUnderstandingFingerprint,
} from "./architecture-scope-understanding-persist";
