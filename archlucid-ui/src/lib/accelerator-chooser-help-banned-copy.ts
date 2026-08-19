/** Buyer-visible copy patterns banned on `/help/accelerator-chooser` (HAX). */
export const ACCELERATOR_CHOOSER_HELP_BANNED_VISIBLE_COPY_PATTERNS = [
  /\bcore pilot\b/i,
  /\bsources package\b/i,
  /\brun and export\b/i,
  /\bstart an architecture review\b/i,
  /\bstart the review\b/i,
] as const;

export function acceleratorChooserHelpCopyContainsBannedPattern(corpus: string): readonly RegExp[] {
  return ACCELERATOR_CHOOSER_HELP_BANNED_VISIBLE_COPY_PATTERNS.filter((pattern) => pattern.test(corpus));
}
