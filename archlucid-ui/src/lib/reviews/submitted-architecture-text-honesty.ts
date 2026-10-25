export const SUBMITTED_ARCHITECTURE_TEXT_NOT_STORED =
  "Submitted architecture text was not stored." as const;

export const SUBMITTED_ARCHITECTURE_TEXT_STORED_EMPTY =
  "Submitted architecture text was stored empty." as const;

/**
 * Maps derived submitted text plus raw run description into create-home / gap surfaces
 * without coercing null into blank prose.
 */
export function formatSubmittedArchitectureTextForSummary(
  derivedSubmittedText: string | null,
  rawDescription: string | null | undefined,
): string {
  if (derivedSubmittedText !== null) {
    return derivedSubmittedText;
  }

  if (rawDescription !== null && rawDescription !== undefined && rawDescription.trim().length === 0) {
    return SUBMITTED_ARCHITECTURE_TEXT_STORED_EMPTY;
  }

  return SUBMITTED_ARCHITECTURE_TEXT_NOT_STORED;
}
