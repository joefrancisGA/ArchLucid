/**
 * Progressive disclosure tier for operator shell navigation (sidebar + mobile drawer).
 *
 * **Product packaging:** tiers express **how much surface** to show within a nav group before the user opts in—aligned
 * with **Core Pilot** (essential-first), then **Advanced Analysis** / **Enterprise Controls** extended and advanced
 * links (`docs/PRODUCT_PACKAGING.md` §2 UI progressive disclosure). Composed **after** group membership and **before**
 * authority filtering in `filterNavLinksForOperatorShell` (`nav-shell-visibility.ts`).
 *
 * Composed with optional `requiredAuthority` on `NavLinkItem` (`nav-config` + `nav-authority`).
 */
export type NavTier = "essential" | "extended" | "advanced";

/**
 * Returns links visible for the current disclosure flags. Extended requires essential; advanced requires extended.
 */
export function filterNavLinksByTier<T extends { tier: NavTier }>(
  links: ReadonlyArray<T>,
  showExtended: boolean,
  showAdvanced: boolean,
): T[] {
  return links.filter((link) => {
    if (link.tier === "essential") {
      return true;
    }

    if (link.tier === "extended") {
      return showExtended;
    }

    return showAdvanced;
  });
}
