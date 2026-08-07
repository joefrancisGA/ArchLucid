/**
 * Base path prefixes for `permanent: true` redirects in `next.config.ts` that are legacy bookmark hops.
 * Namespace redirects (`/reviews` → `/architecture/reviews`) and rewrites are intentional — not listed here.
 */
export const NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS: readonly string[] = [
  "/audit",
  "/alerts",
  "/alert-rules",
  "/policy-packs",
  "/signed-records",
  "/value-report",
  "/settings/cloud-connections",
] as const;

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
