import type { NavLinkItem } from "@/lib/nav-config";
import { filterNavLinksByAuthority } from "@/lib/nav-authority";
import { filterNavLinksByTier } from "@/lib/nav-tier";

/**
 * Single composition point for operator shell navigation (sidebar, mobile drawer, command palette).
 *
 * **Packaging alignment (see docs/PRODUCT_PACKAGING.md):** within each `NAV_GROUPS` block from `nav-config.ts`,
 * **tier** (`nav-tier.ts`) implements **progressive disclosure** (Core Pilot visible first; Advanced Analysis after
 * “Show more”; deeper Enterprise after extended/advanced toggles). **Authority** (`nav-authority.ts`) then filters
 * links by the caller’s resolved policy rank so Advanced / Enterprise destinations match **API reality**, not a
 * second authZ engine.
 *
 * Composition order is deliberate: **tier → authority**. Pass **`useNavCallerAuthorityRank()`** (or
 * `CurrentPrincipal.authorityRank`) so filtering matches `OperatorNavAuthorityProvider`. Call sites should skip
 * rendering a group when this returns an empty array to avoid empty headings.
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
