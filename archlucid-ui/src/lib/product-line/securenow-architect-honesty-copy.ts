/** SecureNow architect honesty deny-list for desk copy (SA-21). */

export const SECURENOW_ARCHITECT_HONESTY_COPY_DENY_PATTERNS: readonly RegExp[] = [
  /\d+\s*%/,
  /exfiltrat/i,
  /apply to azure/i,
  /\bcompliant\b.*\bauditor\b/i,
];

export function violatesSecureNowArchitectHonestyCopy(copy: string): readonly RegExp[] {
  return SECURENOW_ARCHITECT_HONESTY_COPY_DENY_PATTERNS.filter((pattern) => pattern.test(copy));
}

export function assertSecureNowArchitectHonestyCopy(copy: string): void {
  const violations = violatesSecureNowArchitectHonestyCopy(copy);

  if (violations.length > 0) {
    throw new Error(`SecureNow architect copy violated honesty deny-list: ${copy}`);
  }
}
