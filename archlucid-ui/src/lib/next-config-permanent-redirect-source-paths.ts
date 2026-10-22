import { BOOKMARK_PERMANENT_REDIRECTS } from "@/lib/next/bookmark-permanent-redirects";

function bookmarkRedirectSourcePathnames(): string[] {
  const paths = new Set<string>();

  for (const rule of BOOKMARK_PERMANENT_REDIRECTS) {
    const base = rule.source.split("/:")[0]?.trim() ?? rule.source;

    if (base.length > 0) {
      paths.add(base);
    }
  }

  return [...paths].sort((a, b) => a.localeCompare(b));
}

/**
 * Legacy bookmark paths that must not appear in product `href`s (extra redirect hop for users).
 * Sourced from {@link BOOKMARK_PERMANENT_REDIRECTS} (TB-2234 / TB-2236).
 */
export const NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS: readonly string[] =
  bookmarkRedirectSourcePathnames();

export function hrefPathname(href: string): string {
  const trimmed = href.trim();

  if (trimmed.length === 0) {
    return "/";
  }

  return (trimmed.split("?")[0] ?? "/").trim() || "/";
}

/** True when an in-app href targets a legacy redirect source (extra hop for users). */
export function hrefTargetsPermanentRedirectSource(
  href: string,
  sources: readonly string[] = NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS,
): boolean {
  const pathname = hrefPathname(href);

  return sources.some((source) => {
    if (pathname === source) {
      return true;
    }

    return pathname.startsWith(`${source}/`);
  });
}
