import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";

/** Core Pilot surfaces: essential-tier nav only (no Show more / extended / advanced links). */
const CORE_PILOT_ESSENTIAL_ONLY_PATHS = new Set<string>([
  "/",
  SPONSOR_DASHBOARD_HREF,
  FIRST_REVIEW_GUIDE_PATH,
  "/architecture/reviews/new",
  "/architecture/reviews",
  "/administration/extract-upload",
  EVIDENCE_GRAPH_PATH,
]);

function isCorePilotEssentialOnlyPathname(pathname: string): boolean {
  if (CORE_PILOT_ESSENTIAL_ONLY_PATHS.has(pathname)) {
    return true;
  }

  if (pathname === "/help" || pathname.startsWith("/help/")) {
    return true;
  }

  if (pathname === "/administration" || pathname.startsWith("/administration/")) {
    return true;
  }

  return false;
}

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

  if (isCorePilotEssentialOnlyPathname(normalized)) {
    return { showExtended: false, showAdvanced: false };
  }

  return { showExtended, showAdvanced };
}
