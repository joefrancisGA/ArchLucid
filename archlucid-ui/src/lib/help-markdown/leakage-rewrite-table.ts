/**
 * Declarative find/replace rules for help-markdown contributor-leakage strips.
 * Prefer tables over long `.replace()` chains so buyers-facing rewrites stay reviewable.
 */

export type LeakageRewriteRule = {
  readonly pattern: RegExp;
  readonly replacement: string;
};

/** Applies rewrite rules in order. Later rules see earlier replacements. */
export function applyLeakageRewriteTable(
  markdown: string,
  rules: ReadonlyArray<LeakageRewriteRule>,
): string {
  let result = markdown;

  for (const rule of rules) {
    result = result.replace(rule.pattern, rule.replacement);
  }

  return result;
}

/** Same as {@link applyLeakageRewriteTable}, then collapses blank runs and trims trailing whitespace. */
export function applyLeakageRewriteTableThenCleanup(
  markdown: string,
  rules: ReadonlyArray<LeakageRewriteRule>,
): string {
  return applyLeakageRewriteTable(markdown, rules).replace(/\n{3,}/g, "\n\n").trimEnd();
}
