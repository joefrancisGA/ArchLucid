/** Matches banned ghost/link usage on `Button` or `buttonVariants` — not arbitrary component props. */
export const BUTTON_VISIBLE_BOUNDARY_VIOLATION_PATTERNS = [
  /<Button\b[^>]*\bvariant=["']ghost["']/,
  /<Button\b[^>]*\bvariant=["']link["']/,
  /buttonVariants\(\{[^}]*variant:\s*["']ghost["']/,
  /buttonVariants\(\{[^}]*variant:\s*["']link["']/,
  /variant=\{[^}]*\?[^}]*["']ghost["']/,
  /variant=\{[^}]*\?[^}]*["']link["']/,
] as const;

export function findButtonVisibleBoundaryViolations(source: string): readonly string[] {
  const matches: string[] = [];

  for (const pattern of BUTTON_VISIBLE_BOUNDARY_VIOLATION_PATTERNS) {
    if (pattern.test(source)) {
      matches.push(pattern.source);
    }
  }

  return matches;
}
