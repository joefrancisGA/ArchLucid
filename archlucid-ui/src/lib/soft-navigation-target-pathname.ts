/**
 * Resolves the pathname portion of an internal soft-nav href for commit checks.
 */
export function softNavigationTargetPathname(href: string, origin: string = "http://localhost"): string {
  const trimmed = href.trim();

  if (trimmed.length === 0) {
    return "";
  }

  try {
    return new URL(trimmed, origin).pathname;
  } catch {
    const withoutHash = trimmed.split("#")[0] ?? trimmed;
    const withoutQuery = withoutHash.split("?")[0] ?? withoutHash;

    return withoutQuery.length > 0 ? withoutQuery : "/";
  }
}
