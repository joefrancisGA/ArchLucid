/** TB-1375 — customer chrome on the first-review help path must not resurrect Pilot-first or operator-path jargon. */
export const FIRST_ARCHITECTURE_REVIEW_HELP_BANNED_PATTERNS: readonly RegExp[] = [
  /pilot first/i,
  /operate later/i,
  /operator path/i,
  /first-hour-operator-path/i,
  /first hour operator/i,
  /first-hour guide/i,
] as const;

export function firstArchitectureReviewHelpCopyContainsBannedPattern(text: string): readonly RegExp[] {
  return FIRST_ARCHITECTURE_REVIEW_HELP_BANNED_PATTERNS.filter((pattern) => pattern.test(text));
}
