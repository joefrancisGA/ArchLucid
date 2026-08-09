/**
 * Progressive disclosure tier metadata on nav links.
 *
 * **Retired for visibility (owner 2026-08-03):** tier never hides a sidebar row. Operator shell visibility is
 * **role/authority only** (`filterNavLinksByAuthority` in `nav-shell-visibility.ts`). The `tier` field remains on
 * `NavLinkItem` for packaging docs, navigation telemetry (`operator-navigation-telemetry.ts`), and legacy
 * localStorage keys; the no-op `filterNavLinksByTier` filter was removed 2026-08-09.
 */
export type NavTier = "essential" | "extended" | "advanced";
