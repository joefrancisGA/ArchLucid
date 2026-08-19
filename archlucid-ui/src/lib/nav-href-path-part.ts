/**
 * Normalizes nav/sidebar hrefs to a path-only key for pin-state comparisons.
 * Strips query strings and fragments so `/foo?x=1#bar` and `/foo` match.
 */
export function navHrefPathPart(href: string | null | undefined): string {
  if (href === null || href === undefined) {
    return "";
  }

  const trimmed = href.trim();

  if (trimmed.length === 0 || trimmed.startsWith("#")) {
    return "";
  }

  const withoutFragment = trimmed.split("#")[0] ?? "";

  return withoutFragment.split("?")[0] ?? "";
}
