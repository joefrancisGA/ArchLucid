import type { NavLinkItem } from "@/lib/nav-config.types";
import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";
import { PATTERN_LIBRARY_PATH } from "@/lib/pattern-library-route";

const PATTERN_LIBRARY_NAV_HREF = PATTERN_LIBRARY_PATH;

export function omitPatternLibraryNavLink(links: ReadonlyArray<NavLinkItem>): NavLinkItem[] {
  return links.filter((link) => link.href !== PATTERN_LIBRARY_NAV_HREF);
}

export function applyPatternLibraryNavGate(
  rows: ReadonlyArray<NavGroupWithVisibleLinks>,
  patternLibraryNavVisible: boolean,
): NavGroupWithVisibleLinks[] {
  if (patternLibraryNavVisible) {
    return [...rows];
  }

  return rows
    .map((row) => ({
      ...row,
      visibleLinks: omitPatternLibraryNavLink(row.visibleLinks),
    }))
    .filter((row) => row.visibleLinks.length > 0);
}

export function applyPatternLibraryHrefSetGate(
  hrefs: ReadonlySet<string>,
  patternLibraryNavVisible: boolean,
): Set<string> {
  if (patternLibraryNavVisible) {
    return new Set(hrefs);
  }

  const gated = new Set(hrefs);
  gated.delete(PATTERN_LIBRARY_NAV_HREF);

  return gated;
}
