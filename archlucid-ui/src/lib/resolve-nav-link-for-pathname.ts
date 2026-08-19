import type { LucideIcon } from "lucide-react";

import { flattenNavLinks } from "@/lib/nav-config";
import type { NavLinkItem } from "@/lib/nav-config.types";

function hrefToPathname(href: string): string {
  try {
    return new URL(href, "https://archlucid.invalid").pathname;
  } catch {
    return href.split("?")[0] ?? href;
  }
}

function pathMatchesNavHref(pathname: string, linkHref: string | undefined): boolean {
  if (linkHref === undefined || linkHref === "") {
    return false;
  }

  const linkPath = hrefToPathname(linkHref);

  if (linkPath === "/") {
    return pathname === "/";
  }

  if (pathname === linkPath) {
    return true;
  }

  // Query-scoped nav rows (e.g. /architecture/reviews) apply to that list surface only.
  if (linkHref.includes("?")) {
    return false;
  }

  return pathname.startsWith(`${linkPath}/`);
}

/**
 * Resolves the best matching configured nav link for a pathname (longest nav path wins).
 * Navigation config is the authoritative source for route identity icons.
 */
export function resolveNavLinkForPathname(pathname: string): NavLinkItem | undefined {
  const normalizedPath = hrefToPathname(pathname);
  let bestMatch: NavLinkItem | undefined;
  let bestLength = -1;

  for (const link of flattenNavLinks()) {
    const linkPath = hrefToPathname(link.href);

    if (!pathMatchesNavHref(normalizedPath, link.href)) {
      continue;
    }

    if (linkPath.length > bestLength) {
      bestMatch = link;
      bestLength = linkPath.length;
    }
  }

  return bestMatch;
}

/** Resolves the nav icon for a canonical nav href or current pathname. */
export function resolveNavIconForHref(hrefOrPathname: string): LucideIcon | undefined {
  return resolveNavLinkForPathname(hrefOrPathname)?.icon;
}
