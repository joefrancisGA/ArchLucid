/** Core Pilot surfaces: essential-tier nav only (no Show more / extended / advanced links). */
const CORE_PILOT_ESSENTIAL_ONLY_PATHS = new Set<string>([
  "/",
  "/onboarding",
  "/reviews/new",
  "/reviews",
  "/settings/extract-upload",
  "/graph",
]);

/**
 * On Core Pilot surfaces, show only essential-tier nav links so the sidebar matches polished home
 * expectations — without mutating the user's saved disclosure toggles.
 */
export function effectiveNavDisclosureForPathname(
  pathname: string | null,
  showExtended: boolean,
  showAdvanced: boolean,
): { showExtended: boolean; showAdvanced: boolean } {
  const normalized = pathname ?? "";

  if (CORE_PILOT_ESSENTIAL_ONLY_PATHS.has(normalized)) {
    return { showExtended: false, showAdvanced: false };
  }

  return { showExtended, showAdvanced };
}
