import type { NavLinkItem } from "@/lib/nav-config";
import { filterNavLinksByAuthority } from "@/lib/nav-authority";
import { filterNavLinksByTier } from "@/lib/nav-tier";

/**
 * Single composition point for operator shell navigation (sidebar, mobile drawer, command palette):
 * progressive disclosure **tier** first, then **requiredAuthority** (see `nav-config` + `nav-authority`).
 * Pass **`useNavCallerAuthorityRank()`** (or an explicit rank from `CurrentPrincipal.authorityRank`) so filtering matches `OperatorNavAuthorityProvider`.
 * Call sites should skip rendering a group when this returns an empty array to avoid empty headings.
 */
export function filterNavLinksForOperatorShell(
  links: ReadonlyArray<NavLinkItem>,
  showExtended: boolean,
  showAdvanced: boolean,
  callerAuthorityRank: number,
): NavLinkItem[] {
  return filterNavLinksByAuthority(
    filterNavLinksByTier(links, showExtended, showAdvanced),
    callerAuthorityRank,
  );
}
