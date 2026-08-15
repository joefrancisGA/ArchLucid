/** Buyer-safe limitations heading for `/help/azure-boards` (TB-1622). */
export const AZURE_BOARDS_HELP_LIMITATIONS_HEADING = "Known limitations in this release" as const;

/** Customer chrome must not resurrect eng release-phase jargon (TB-1622). */
export const AZURE_BOARDS_HELP_BANNED_VISIBLE_COPY_PATTERNS: readonly RegExp[] = [
  /\bphase\s*1\b/i,
  /known limitations \(phase 1\)/i,
] as const;

export function azureBoardsHelpCopyContainsBannedPattern(corpus: string): readonly RegExp[] {
  return AZURE_BOARDS_HELP_BANNED_VISIBLE_COPY_PATTERNS.filter((pattern) => pattern.test(corpus));
}
