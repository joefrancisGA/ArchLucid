import type { NavLinkItem } from "@/lib/nav-config.types";
import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";
import { PATTERN_LIBRARY_NAV_UNAVAILABLE_TITLE } from "@/lib/pattern-library-copy";
import { PATTERN_LIBRARY_PATH } from "@/lib/pattern-library-route";

const PATTERN_LIBRARY_NAV_HREF = PATTERN_LIBRARY_PATH;

function markPatternLibraryNavLinkDisabled(link: NavLinkItem): NavLinkItem {
  if (link.href !== PATTERN_LIBRARY_NAV_HREF) {
    return link;
  }

  return {
    ...link,
    navLinkDisabled: true,
    navLinkDisabledTitle: PATTERN_LIBRARY_NAV_UNAVAILABLE_TITLE,
  };
}

export function applyPatternLibraryNavGate(
  rows: ReadonlyArray<NavGroupWithVisibleLinks>,
  patternLibraryNavVisible: boolean,
): NavGroupWithVisibleLinks[] {
  if (patternLibraryNavVisible) {
    return [...rows];
  }

  return rows.map((row) => ({
    ...row,
    visibleLinks: row.visibleLinks.map(markPatternLibraryNavLinkDisabled),
  }));
}

export function applyPatternLibraryHrefSetGate(
  hrefs: ReadonlySet<string>,
  patternLibraryNavVisible: boolean,
): Set<string> {
  if (patternLibraryNavVisible) {
    return new Set(hrefs);
  }

  return new Set(hrefs);
}
