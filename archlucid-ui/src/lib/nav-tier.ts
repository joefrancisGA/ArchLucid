/**
 * Progressive disclosure tier metadata on nav links.
 *
 * **Retired for visibility (owner 2026-08-03):** `filterNavLinksByTier` no longer hides links.
 * Operator shell visibility is **role/authority only** (`filterNavLinksByAuthority` in
 * `nav-shell-visibility.ts`). The `tier` field remains on `NavLinkItem` for packaging docs and
 * legacy localStorage keys; it is not used to omit sidebar rows.
 */
export type NavTier = "essential" | "extended" | "advanced";

/**
 * Previously filtered by progressive-disclosure flags. Always returns every link so callers that
 * still pass `showExtended` / `showAdvanced` keep compiling without shaping the sidebar.
 */
export function filterNavLinksByTier<T extends { tier: NavTier }>(
  links: ReadonlyArray<T>,
  _showExtended: boolean,
  _showAdvanced: boolean,
): T[] {
  void _showExtended;
  void _showAdvanced;

  return [...links];
}
