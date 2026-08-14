/** Matches banned ghost/link usage on `Button` or `buttonVariants` — not arbitrary component props. */
export const BUTTON_VISIBLE_BOUNDARY_VIOLATION_PATTERNS = [
  /<Button\b[^>]*\bvariant=["']ghost["']/,
  /<Button\b[^>]*\bvariant=["']link["']/,
  /buttonVariants\(\{[^}]*variant:\s*["']ghost["']/,
  /buttonVariants\(\{[^}]*variant:\s*["']link["']/,
  /variant=\{[^}]*\?[^}]*["']ghost["']/,
  /variant=\{[^}]*\?[^}]*["']link["']/,
] as const;

/** TB-2295: semantic-color overrides on `Button` className (rose/amber/emerald fills and tints). */
export const BUTTON_SEMANTIC_COLOR_OVERRIDE_PATTERNS = [
  /<Button\b[^>]*className=["'][^"']*\bbg-(rose|amber|emerald)-/,
  /<Button\b[^>]*className=["'][^"']*\btext-(rose|amber|emerald)-/,
  /<Button\b[^>]*className=["'][^"']*\bborder-(rose|amber|emerald)-/,
  /<Button\b[^>]*className=\{[^}]*\bbg-(rose|amber|emerald)-/,
  /<Button\b[^>]*className=\{[^}]*\btext-(rose|amber|emerald)-/,
  /<Button\b[^>]*className=\{[^}]*\bborder-(rose|amber|emerald)-/,
] as const;

/**
 * Tailwind chromatic utilities on `Button` className (TB-2295).
 * Layout typography (`text-left`, `text-sm`) and sizing-only classes are intentionally excluded.
 */
const TAILWIND_CHROMATIC_SCALE =
  "(?:neutral|red|rose|pink|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|slate|gray|zinc|stone|white|black)";

export const BUTTON_CLASSNAME_COLOR_UTILITY_PATTERN = new RegExp(
  String.raw`\b(?:(?:hover:|dark:)?(?:bg|text|border)-${TAILWIND_CHROMATIC_SCALE}|text-al-text|bg-al-|border-al-|hover:bg-\[var\(--al-)`,
);

const BUTTON_OPEN_TAG_PATTERN = /<Button\b[^>]*>/gs;

function collectButtonOpenTags(source: string): string[] {
  return source.match(BUTTON_OPEN_TAG_PATTERN) ?? [];
}

export function findButtonVisibleBoundaryViolations(source: string): readonly string[] {
  const matches: string[] = [];

  for (const pattern of BUTTON_VISIBLE_BOUNDARY_VIOLATION_PATTERNS) {
    if (pattern.test(source)) {
      matches.push(pattern.source);
    }
  }

  return matches;
}

export function findButtonSemanticColorOverrideViolations(source: string): readonly string[] {
  const matches: string[] = [];

  for (const pattern of BUTTON_SEMANTIC_COLOR_OVERRIDE_PATTERNS) {
    if (pattern.test(source)) {
      matches.push(pattern.source);
    }
  }

  return matches;
}

export function findButtonClassNameColorOverrideViolations(source: string): readonly string[] {
  const matches: string[] = [];

  for (const tag of collectButtonOpenTags(source)) {

    if (BUTTON_CLASSNAME_COLOR_UTILITY_PATTERN.test(tag)) {
      matches.push(tag.trim());
    }
  }

  return matches;
}
