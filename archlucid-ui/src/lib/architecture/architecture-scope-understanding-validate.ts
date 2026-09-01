import type {
  DeriveScopeUnderstandingBulletsInput,
  ScopeItemValidation,
  ScopeUnderstandingBullet,
} from "./architecture-scope-understanding-shared";
import {
  SCOPE_ITEM_DUPLICATE_MESSAGE,
  SCOPE_ITEM_MAX_LENGTH,
  SCOPE_ITEM_MIN_LENGTH,
  SCOPE_ITEM_NO_LETTER_MESSAGE,
  SCOPE_ITEM_TOO_LONG_MESSAGE,
  SCOPE_ITEM_TOO_SHORT_MESSAGE,
  scopeBulletBehavior,
  stripScopeUnderstandingSection,
} from "./architecture-scope-understanding-shared";
import { scopeBulletText } from "./architecture-scope-understanding-derive";

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
