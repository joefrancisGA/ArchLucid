/** Which intake field a scope row came from. Drives the row's static label and its edit behavior. */
import {
  GUIDED_INTAKE_ARCHITECTURE_CONTEXT_LABEL,
  GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_LABEL,
  GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL,
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
  readonly peopleAndSystems?: readonly { readonly label: string; readonly kind: string }[];
  readonly missingItemLabels?: readonly string[];
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

export const SCOPE_UNDERSTANDING_HEADING = "What ArchLucid will treat as in-scope";
export const SCOPE_UNDERSTANDING_HELPER =
  "Edit these lines or add your own, then confirm. Confirmed scope is saved into the intake brief the reviewer reads.";
export const SCOPE_UNDERSTANDING_ADD_LABEL = "Add an in-scope item";
export const SCOPE_UNDERSTANDING_ADD_PLACEHOLDER =
  "Type a system, constraint, or boundary, then choose Add to scope";
export const SCOPE_UNDERSTANDING_ADD_BUTTON_LABEL = "Add to scope";
export const SCOPE_UNDERSTANDING_ADD_HINT =
  "Type the item in the field, then choose Add to scope (or press Enter).";
export const SCOPE_UNDERSTANDING_ADD_EFFECT_HINT =
  "Items you add become scope lines in the intake brief — write each one the way you would state the boundary to a reviewer.";
/** Default pointer to the field that owns the architecture context text on the architecture draft page. */
export const SCOPE_CONTEXT_SOURCE_DEFAULT_LABEL = `${GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_LABEL} above`;

export function scopeReadOnlyHint(contextSourceLabel: string): string {
  return `Read-only preview — edit this in ${contextSourceLabel}.`;
}

export const SCOPE_UNDERSTANDING_READ_ONLY_HINT = scopeReadOnlyHint(
  SCOPE_CONTEXT_SOURCE_DEFAULT_LABEL,
);
export const SCOPE_UNDERSTANDING_CONFIRM_LABEL = "Confirm scope";
/** Shown near Confirm scope when only placeholder guidance is present (TB-2005). */
export const SCOPE_UNDERSTANDING_CONFIRM_BLOCKED_HINT =
  "Add at least one in-scope item from the brief above before confirming scope.";
export const SCOPE_UNDERSTANDING_SECTION_HEADER = "Operator-confirmed in-scope understanding";
/** Ready line for surfaces where confirming scope is the last step before the review starts. */
export const SCOPE_UNDERSTANDING_READY_HINT = "Scope confirmed — you can start the review.";
/** Ready line for wizards that confirm scope on an earlier step. */
export const SCOPE_UNDERSTANDING_READY_TO_CONTINUE_HINT = "Scope confirmed — you can continue.";

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
  people: { editable: true, removable: false, includeInBrief: true, label: "People in Scope" },
  systems: { editable: true, removable: false, includeInBrief: true, label: "Systems in Scope" },
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

/** Flattens a typed row back to the `Label: value` line used in the brief and in assertions. */
export function scopeBulletText(bullet: ScopeUnderstandingBullet): string {
  const value = bullet.value.trim();

  if (bullet.label.length === 0) {
    return value;
  }

  return `${bullet.label}: ${value}`;
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

function pushUniqueBullet(
  bullets: ScopeUnderstandingBullet[],
  kind: ScopeUnderstandingBulletKind,
  id: string,
  value: string,
): void {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return;
  }

  const candidate: ScopeUnderstandingBullet = {
    id,
    kind,
    label: scopeBulletBehavior(kind).label,
    value: trimmed,
    source: "inferred",
  };
  const duplicate = bullets.some(
    (bullet) => scopeBulletText(bullet).toLowerCase() === scopeBulletText(candidate).toLowerCase(),
  );

  if (duplicate) {
    return;
  }

  bullets.push(candidate);
}

/** Stable per-row id so operator edits survive re-derivation when the form above changes. */
function gapBulletId(label: string): string {
  return `gap-${label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

/** Derives typed in-scope rows from intake / create-home context (TB-2176). */
export function deriveScopeUnderstandingBullets(
  input: DeriveScopeUnderstandingBulletsInput,
): ScopeUnderstandingBullet[] {
  const bullets: ScopeUnderstandingBullet[] = [];
  const architectureName = input.architectureName?.trim() ?? input.systemName?.trim() ?? "";

  pushUniqueBullet(bullets, "system", "system", architectureName);

  const outcome = stripScopeUnderstandingSection(input.businessOutcome).trim();

  pushUniqueBullet(bullets, "outcome", "outcome", outcome);

  const overview = stripScopeUnderstandingSection(
    input.architectureOverview ?? input.intentText,
  ).trim();

  if (overview.length > 0) {
    const excerpt =
      overview.length > SCOPE_CONTEXT_PREVIEW_MAX_LENGTH
        ? `${overview.slice(0, SCOPE_CONTEXT_PREVIEW_MAX_LENGTH - 1).trimEnd()}…`
        : overview;

    pushUniqueBullet(bullets, "context", "context", excerpt);
  }

  const people = (input.peopleAndSystems ?? [])
    .filter((entry) => entry.kind === "Human" || entry.kind === "Both")
    .map((entry) => entry.label.trim())
    .filter((label) => label.length > 0);
  const systems = (input.peopleAndSystems ?? [])
    .filter((entry) => entry.kind === "Machine" || entry.kind === "Both")
    .map((entry) => entry.label.trim())
    .filter((label) => label.length > 0);

  pushUniqueBullet(bullets, "people", "people", people.slice(0, 4).join(", "));
  pushUniqueBullet(bullets, "systems", "systems", systems.slice(0, 4).join(", "));

  for (const label of input.missingItemLabels ?? []) {
    pushUniqueBullet(bullets, "gap", gapBulletId(label), label);
  }

  if (bullets.length === 0) {
    pushUniqueBullet(
      bullets,
      "fallback",
      "fallback",
      "ArchLucid will infer scope from the brief and evidence you provide in this intake.",
    );
  }

  return bullets;
}

export type ReconcileScopeUnderstandingBulletsInput = {
  readonly inferred: readonly ScopeUnderstandingBullet[];
  readonly previous: readonly ScopeUnderstandingBullet[];
  /** Rows the operator removed — they must not reappear when the form above is edited again. */
  readonly dismissedIds: readonly string[];
};

/**
 * Re-derivation must not silently discard operator work: a row the operator edited keeps its value,
 * operator-added rows are preserved, and removed rows stay removed.
 */
export function reconcileScopeUnderstandingBullets(
  input: ReconcileScopeUnderstandingBulletsInput,
): ScopeUnderstandingBullet[] {
  const previousById = new Map(input.previous.map((bullet) => [bullet.id, bullet]));
  const dismissedIds = new Set(input.dismissedIds);
  const derivedRows = input.inferred
    .filter((bullet) => !dismissedIds.has(bullet.id))
    .map((bullet) => {
      const prior = previousById.get(bullet.id);

      if (prior === undefined || prior.source !== "user") {
        return bullet;
      }

      return { ...bullet, value: prior.value, source: "user" as const };
    });
  const operatorRows = input.previous.filter(
    (bullet) => bullet.kind === "custom" && !dismissedIds.has(bullet.id),
  );

  return [...derivedRows, ...operatorRows];
}

export type ScopeItemValidation =
  | { readonly status: "empty" }
  | { readonly status: "valid" }
  | { readonly status: "invalid"; readonly message: string };

/** Hard client validation for the add field — the Add button stays disabled unless this returns `valid`. */
export function validateScopeUnderstandingItem(
  candidate: string,
  existingBullets: readonly ScopeUnderstandingBullet[],
): ScopeItemValidation {
  const trimmed = candidate.trim();

  if (trimmed.length === 0) {
    return { status: "empty" };
  }

  if (trimmed.length < SCOPE_ITEM_MIN_LENGTH) {
    return { status: "invalid", message: SCOPE_ITEM_TOO_SHORT_MESSAGE };
  }

  if (trimmed.length > SCOPE_ITEM_MAX_LENGTH) {
    return { status: "invalid", message: SCOPE_ITEM_TOO_LONG_MESSAGE };
  }

  // Rejects punctuation/digit-only entries such as "1234" or "!!!" that carry no reviewable meaning.
  // `\p{L}` matches a letter in any script, so non-Latin scope items still pass.
  if (!/\p{L}/u.test(trimmed)) {
    return { status: "invalid", message: SCOPE_ITEM_NO_LETTER_MESSAGE };
  }

  const duplicate = existingBullets.some(
    (bullet) => bullet.value.trim().toLowerCase() === trimmed.toLowerCase(),
  );

  if (duplicate) {
    return { status: "invalid", message: SCOPE_ITEM_DUPLICATE_MESSAGE };
  }

  return { status: "valid" };
}

/**
 * The confirmed scope lines a reviewer will actually read. Single source of truth so a summary
 * rendered before submit cannot disagree with what the brief carries.
 */
export function scopeBriefLines(bullets: readonly ScopeUnderstandingBullet[]): string[] {
  return bullets
    .filter((bullet) => scopeBulletBehavior(bullet.kind).includeInBrief)
    .filter((bullet) => bullet.value.trim().length > 0)
    .map((bullet) => scopeBulletText(bullet));
}

/** True when confirming scope would add at least one reviewer-facing line to the brief. */
export function canConfirmScopeUnderstanding(
  bullets: readonly ScopeUnderstandingBullet[],
  input?: DeriveScopeUnderstandingBulletsInput,
): boolean {
  const briefLines = scopeBriefLines(bullets);

  if (briefLines.length === 0) {
    return false;
  }

  if (bullets.some((bullet) => bullet.kind === "custom" && bullet.value.trim().length > 0)) {
    return true;
  }

  if (input !== undefined && !hasScopeSourceBriefContent(input)) {
    return false;
  }

  return true;
}

function hasScopeSourceBriefContent(input: DeriveScopeUnderstandingBulletsInput): boolean {
  const architectureName = input.architectureName?.trim() ?? input.systemName?.trim() ?? "";
  const outcome = stripScopeUnderstandingSection(input.businessOutcome).trim();
  const overview = stripScopeUnderstandingSection(input.architectureOverview ?? input.intentText).trim();

  return architectureName.length > 0 || outcome.length > 0 || overview.length > 0;
}

export function mergeScopeBulletsIntoBrief(
  bullets: readonly ScopeUnderstandingBullet[],
  baseBrief: string,
): string {
  const trimmedBrief = baseBrief.trim();
  const bulletLines = scopeBriefLines(bullets).map((line) => `- ${line}`);

  if (bulletLines.length === 0) {
    return trimmedBrief;
  }

  const section = `${SCOPE_UNDERSTANDING_SECTION_HEADER}:\n${bulletLines.join("\n")}`;

  if (trimmedBrief.length === 0) {
    return section;
  }

  if (trimmedBrief.includes(SCOPE_UNDERSTANDING_SECTION_HEADER)) {
    return trimmedBrief;
  }

  return `${trimmedBrief}\n\n${section}`;
}

/**
 * Trims and drops empty rows. Applied at confirm time only — trimming on every keystroke would stop
 * the operator typing a space between words.
 */
export function normalizeScopeUnderstandingBullets(
  bullets: readonly ScopeUnderstandingBullet[],
): ScopeUnderstandingBullet[] {
  return bullets
    .map((bullet) => ({
      ...bullet,
      value: bullet.value.trim(),
    }))
    .filter((bullet) => bullet.value.length > 0);
}
