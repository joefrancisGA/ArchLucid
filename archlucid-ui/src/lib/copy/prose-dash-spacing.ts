/** Spaced em dash for buyer-facing prose (Carbon / Fluent punctuation rhythm). */
export const PROSE_EM_DASH = " — ";

/**
 * Matches an em dash glued to words on either side (`inventory—or`).
 * Does not match already-spaced dashes (`inventory — or`).
 */
export const TIGHT_PROSE_EM_DASH_PATTERN = /(?<=[\w\d)"'.,;!?])—(?=[\w\d("'(\[])/g;

/** Inserts spaces around em dashes when copy authors omit them. */
export function normalizeProseEmDashSpacing(text: string): string {
  if (text.length === 0) {
    return text;
  }

  return text.replace(TIGHT_PROSE_EM_DASH_PATTERN, PROSE_EM_DASH);
}

/** True when `text` contains at least one tight em dash. */
export function hasTightProseEmDash(text: string): boolean {
  TIGHT_PROSE_EM_DASH_PATTERN.lastIndex = 0;

  return TIGHT_PROSE_EM_DASH_PATTERN.test(text);
}
