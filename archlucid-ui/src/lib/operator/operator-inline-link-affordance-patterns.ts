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
  "MARKETING_PRIMARY_FILL_CLASS",
  "MARKETING_HERO_SECONDARY_CTA_CLASS",
  // Cross-module link tokens whose definitions carry a resting underline.
  "TOOLTIP_TYPOGRAPHY.link",
  "DESIGN_TOKENS.accent.link",
  // Evidence-orientation style bundle: every `link` variant is OPERATOR_LINK.inline
  // or an explicit underline (see evidence-orientation-styles.ts).
  "style.link",
] as const;

/**
 * Class fragments that carry a dedicated nav or chip treatment, so the anchor is
 * already visibly interactive without inline-link tokens. `shell-nav-link` lives in
 * the affordance list above for historical reasons; these are its peers.
 */
export const OPERATOR_INLINE_LINK_OWN_CHROME_TOKENS = [
  "marketing-public-nav-link",
  "MARKETING_PUBLIC_NAV_LINK_CLASS",
  "DESIGN_TOKENS.interactive.chip",
  "DESIGN_TOKENS.interactive.navActive",
  "DESIGN_TOKENS.card",
  "OPERATOR_BUTTON_COMPACT_CLASS",
  // Shared helpers that stamp button, badge, or icon-trigger chrome onto an anchor.
  "buttonVariants",
  "badgeClassName",
  "helpTooltipLinkClassName",
  "PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME",
  // Table-of-contents rails and jump-nav chips — dedicated wayfinding chrome.
  "HELP_PAGE_TOC.link",
  "PRIVACY_POLICY_TOC.link",
  "PRIVACY_POLICY_LAYOUT.quickNavLink",
  "PRIVACY_POLICY_LAYOUT.relatedCard",
] as const;

/** ARIA roles that make the anchor a composite-widget row rather than body copy. */
const OWN_CHROME_ROLES = ["menuitem", "option", "treeitem"] as const;

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

/**
 * TB-1671 excludes anchors that "already supply their own visible boundary or
 * hit-target chrome" — chips, cards, tiles, and dropdown rows. Those are not body
 * copy, so a resting underline would be wrong rather than missing.
 */
export function hasOperatorInlineLinkOwnChrome(value: string): boolean {
  for (const token of OPERATOR_INLINE_LINK_OWN_CHROME_TOKENS) {
    if (value.includes(token)) {
      return true;
    }
  }

  for (const role of OWN_CHROME_ROLES) {
    if (value.includes(`role="${role}"`)) {
      return true;
    }
  }

  if (hasVisibleBoundary(value) && hasBoxPadding(value)) {
    return true;
  }

  // A block-level anchor wraps a card or tile whose children paint the boundary;
  // require a box or hover-surface cue so plain `block` prose links still fail.
  return isBlockLevel(value) && (hasBoxPadding(value) || hasVisibleBoundary(value) || hasHoverSurface(value));
}

function hasVisibleBoundary(value: string): boolean {
  return /(?:^|[\s"'`:])(?:border|border-\d|ring-\d|shadow-(?:sm|md|lg)|rounded(?:-\w+)?)\b/.test(value)
    || /(?:^|[\s"'`:])bg-(?!transparent\b)/.test(value);
}

function hasBoxPadding(value: string): boolean {
  return /(?:^|[\s"'`:])p[xy]?-\d/.test(value);
}

function hasHoverSurface(value: string): boolean {
  return /hover:(?:bg-|ring-|shadow-|border-)/.test(value);
}

function isBlockLevel(value: string): boolean {
  return /(?:^|[\s"'`:])(?:block|flex|grid)\b/.test(value);
}

export function isOperatorInlineLinkAffordanceExempt(openingTag: string, sourceBeforeTag: string): boolean {
  if (isWrappedInAsChildButton(sourceBeforeTag)) {
    return true;
  }

  if (hasOperatorInlineLinkOwnChrome(openingTag)) {
    return true;
  }

  if (isSkipLink(openingTag)) {
    return true;
  }

  if (!hasNavigationalHref(openingTag)) {
    return true;
  }

  return false;
}

/**
 * Skip links are visually hidden until focused, so a resting underline is neither
 * possible nor desirable. Covers raw classes and the shared layout tokens.
 */
function isSkipLink(openingTag: string): boolean {
  return /\bskip-link\b/.test(openingTag)
    || /\bdata-skip-link\b/.test(openingTag)
    || /\bskip-to-main\b/.test(openingTag)
    || /\bsr-only\b/.test(openingTag)
    || /[Ss]kipLink\b/.test(openingTag);
}

/** Components that donate their own chrome to a child anchor. */
const CHROME_DONATING_WRAPPERS = ["asChild", "CommandItem"] as const;

/**
 * A `<Button asChild>` wrapper (or a cmdk `CommandItem` row) donates its chrome to
 * the anchor it wraps, so the anchor is exempt. The wrapper only counts while it is
 * still open — otherwise one wrapper would exempt every later link in the file.
 * Its own closing tag is the boundary, so an anchor in the second branch of a
 * ternary still counts as wrapped even though the first branch closed its tag.
 */
function isWrappedInAsChildButton(sourceBeforeTag: string): boolean {
  return CHROME_DONATING_WRAPPERS.some((marker) => isInsideOpenWrapper(sourceBeforeTag, marker));
}

function isInsideOpenWrapper(sourceBeforeTag: string, marker: string): boolean {
  const markerIndex = sourceBeforeTag.lastIndexOf(marker);

  if (markerIndex < 0) {
    return false;
  }

  const wrapperName = wrapperTagNameAt(sourceBeforeTag, markerIndex);

  if (wrapperName === null) {
    return false;
  }

  const afterWrapper = sourceBeforeTag.slice(markerIndex);
  const closing = new RegExp(`</${escapeForRegExp(wrapperName)}\\s*>`);

  return !closing.test(afterWrapper);
}

/** Resolves the element name that owns the wrapper marker at `markerIndex`. */
function wrapperTagNameAt(source: string, markerIndex: number): string | null {
  const openBracket = source.lastIndexOf("<", markerIndex);

  if (openBracket < 0) {
    return null;
  }

  const named = /^<([A-Za-z][\w.]*)/.exec(source.slice(openBracket, markerIndex + 1));

  return named === null ? null : (named[1] ?? null);
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
 * Collects module-level identifiers whose definition carries an affordance token or
 * its own chrome, so `className={monoLinkCls}` is recognized when `monoLinkCls` is
 * built from `OPERATOR_LINK`, and `className={shell}` when `shell` is a chip.
 */
export function collectAffordanceBearingIdentifiers(source: string): ReadonlySet<string> {
  const identifiers = new Set<string>();
  const declaration = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*([\s\S]*?);\s*(?:\r?\n|$)/g;
  let match = declaration.exec(source);

  while (match !== null) {
    const name = match[1];
    const value = match[2];

    if (
      name !== undefined
      && value !== undefined
      && (hasOperatorInlineLinkAffordance(value) || hasOperatorInlineLinkOwnChrome(value))
    ) {
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
