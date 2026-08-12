/**
 * TB-1675 — Detect navigational `<Link>` / `<a href>` without resting link affordance tokens.
 *
 * Contract: `docs/library/UI_DESIGN_SYSTEM.md` § *Operator / marketing inline links* (**TB-1671**).
 */

export type OperatorInlineLinkAffordanceViolation = {
  readonly relativePath: string;
  readonly line: number;
  readonly snippet: string;
};

/** Tokens that satisfy the TB-1671 resting-affordance contract in className/cn(). */
export const OPERATOR_INLINE_LINK_AFFORDANCE_TOKENS = [
  "OPERATOR_LINK",
  "text-al-link",
  "MARKETING_SURFACES.inlineLink",
  "MARKETING_SURFACES.link",
  "workflow-inline-link",
  "shell-nav-link",
  "MARKETING_PRIMARY_CTA_CLASS",
  "MARKETING_HERO_SECONDARY_CTA_CLASS",
] as const;

const EXCLUDED_RELATIVE_PATH_SUFFIXES = [
  ".test.tsx",
  ".test.ts",
  "/__tests__/",
  "/__snapshots__/",
] as const;

const EXCLUDED_RELATIVE_PATHS = new Set<string>([
  "lib/design-tokens.ts",
  "lib/operator/operator-inline-link-affordance-patterns.ts",
  "lib/operator/operator-inline-link-affordance-baseline.ts",
]);

export function shouldScanOperatorInlineLinkAffordanceFile(relativePath: string): boolean {
  if (!relativePath.endsWith(".tsx")) {
    return false;
  }

  if (EXCLUDED_RELATIVE_PATHS.has(relativePath)) {
    return false;
  }

  for (const suffix of EXCLUDED_RELATIVE_PATH_SUFFIXES) {
    if (relativePath.includes(suffix)) {
      return false;
    }
  }

  return true;
}

export function hasOperatorInlineLinkAffordance(openingTag: string): boolean {
  for (const token of OPERATOR_INLINE_LINK_AFFORDANCE_TOKENS) {
    if (openingTag.includes(token)) {
      return true;
    }
  }

  return hasRestingUnderline(openingTag);
}

function hasRestingUnderline(value: string): boolean {
  if (!/\bunderline\b/.test(value)) {
    return false;
  }

  // `hover:underline` alone is hover-only, which TB-1671 explicitly bans as the
  // sole affordance, and `no-underline` cancels an inherited one.
  if (/\bno-underline\b/.test(value)) {
    return false;
  }

  return /(?:^|[\s"'`{(,])underline\b/.test(value);
}

export function isOperatorInlineLinkAffordanceExempt(openingTag: string, sourceBeforeTag: string): boolean {
  if (isWrappedInAsChildButton(sourceBeforeTag)) {
    return true;
  }

  if (/\bskip-link\b/.test(openingTag) || /\bsr-only\b/.test(openingTag)) {
    return true;
  }

  if (/\bdata-skip-link\b/.test(openingTag)) {
    return true;
  }

  if (!hasNavigationalHref(openingTag)) {
    return true;
  }

  return false;
}

/**
 * A `<Button asChild>` (or any `asChild` wrapper) donates its own chrome to the
 * anchor it wraps, so the anchor is exempt. Only the nearest unclosed wrapper
 * counts — otherwise one `asChild` button would exempt every later link in the file.
 */
function isWrappedInAsChildButton(sourceBeforeTag: string): boolean {
  const lastAsChild = sourceBeforeTag.lastIndexOf("asChild");

  if (lastAsChild < 0) {
    return false;
  }

  const afterWrapper = sourceBeforeTag.slice(lastAsChild);

  return !/<\/[A-Za-z][\w.]*>|\/>/.test(afterWrapper);
}

function hasNavigationalHref(openingTag: string): boolean {
  if (!/\bhref=/.test(openingTag)) {
    return false;
  }

  if (/\bhref=\{?\s*(?:undefined|null|false)\s*\}?/.test(openingTag)) {
    return false;
  }

  return true;
}

function compactSnippet(openingTag: string): string {
  return openingTag.replace(/\s+/g, " ").trim().slice(0, 120);
}

/** Matches the start of a navigational anchor tag, for scanners that walk link opening tags. */
export const ANCHOR_TAG_START = /<(?:Link|a)\b/g;

/**
 * Finds the index just past the `>` that closes a JSX opening tag, ignoring `>`
 * characters that appear inside string literals or `{...}` expressions (e.g.
 * `href={cond ? a : b}` or `packId.length > 0`).
 */
export function findOpeningTagEnd(source: string, tagStart: number): number {
  let braceDepth = 0;
  let quote: string | null = null;

  for (let index = tagStart; index < source.length; index += 1) {
    const char = source[index];

    if (quote !== null) {
      if (char === quote) {
        quote = null;
      }

      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") {
      braceDepth += 1;
      continue;
    }

    if (char === "}") {
      braceDepth -= 1;
      continue;
    }

    if (char === ">" && braceDepth === 0) {
      return index + 1;
    }
  }

  return source.length;
}

/**
 * Collects module-level identifiers whose definition carries an affordance token,
 * so `className={monoLinkCls}` is recognized when `monoLinkCls` is built from
 * `OPERATOR_LINK`.
 */
export function collectAffordanceBearingIdentifiers(source: string): ReadonlySet<string> {
  const identifiers = new Set<string>();
  const declaration = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*([\s\S]*?);\s*(?:\r?\n|$)/g;
  let match = declaration.exec(source);

  while (match !== null) {
    const name = match[1];
    const value = match[2];

    if (name !== undefined && value !== undefined && hasOperatorInlineLinkAffordance(value)) {
      identifiers.add(name);
    }

    match = declaration.exec(source);
  }

  return identifiers;
}

function referencesAffordanceIdentifier(
  openingTag: string,
  affordanceIdentifiers: ReadonlySet<string>,
): boolean {
  if (affordanceIdentifiers.size === 0) {
    return false;
  }

  const referenced = openingTag.match(/[A-Za-z_$][\w$]*/g);

  if (referenced === null) {
    return false;
  }

  return referenced.some((name) => affordanceIdentifiers.has(name));
}

function lineNumberAt(source: string, index: number): number {
  let line = 1;

  for (let cursor = 0; cursor < index && cursor < source.length; cursor += 1) {
    if (source[cursor] === "\n") {
      line += 1;
    }
  }

  return line;
}

export function findOperatorInlineLinkAffordanceViolations(
  source: string,
  relativePath: string,
): readonly OperatorInlineLinkAffordanceViolation[] {
  const violations: OperatorInlineLinkAffordanceViolation[] = [];
  const affordanceIdentifiers = collectAffordanceBearingIdentifiers(source);
  const anchorStart = new RegExp(ANCHOR_TAG_START.source, "g");
  let match = anchorStart.exec(source);

  while (match !== null) {
    const tagStart = match.index;
    const tagEnd = findOpeningTagEnd(source, tagStart);
    const openingTag = source.slice(tagStart, tagEnd);

    if (
      !isOperatorInlineLinkAffordanceExempt(openingTag, source.slice(0, tagStart))
      && !hasOperatorInlineLinkAffordance(openingTag)
      && !referencesAffordanceIdentifier(openingTag, affordanceIdentifiers)
    ) {
      violations.push({
        relativePath,
        line: lineNumberAt(source, tagStart),
        snippet: compactSnippet(openingTag),
      });
    }

    anchorStart.lastIndex = tagEnd;
    match = anchorStart.exec(source);
  }

  return violations;
}

export function formatOperatorInlineLinkAffordanceViolationKey(
  violation: OperatorInlineLinkAffordanceViolation,
): string {
  return `${violation.relativePath}:${violation.line}`;
}

export function collectOperatorInlineLinkAffordanceViolationsUnderSrc(
  srcRoot: string,
  readFile: (absolutePath: string) => string,
  listFiles: (absoluteDir: string) => string[],
): readonly OperatorInlineLinkAffordanceViolation[] {
  const violations: OperatorInlineLinkAffordanceViolation[] = [];
  const normalizedRoot = srcRoot.replace(/\\/g, "/");

  for (const absolutePath of listFiles(srcRoot)) {
    const relativePath = absolutePath.replace(/\\/g, "/").replace(`${normalizedRoot}/`, "");

    if (!shouldScanOperatorInlineLinkAffordanceFile(relativePath)) {
      continue;
    }

    violations.push(...findOperatorInlineLinkAffordanceViolations(readFile(absolutePath), relativePath));
  }

  return violations;
}
