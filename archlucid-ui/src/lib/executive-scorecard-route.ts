import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";

/** Retired sponsor scorecard bookmark — merged onto the executive dashboard (IA batch). */
export const LEGACY_EXECUTIVE_SCORECARD_PATH = "/executive/scorecard" as const;

/** Canonical destination after retiring the standalone executive scorecard page. */
export const EXECUTIVE_SCORECARD_REDIRECT_HREF = EXECUTIVE_DASHBOARD_HREF;

export function isLegacyExecutiveScorecardPath(pathname: string): boolean {
  return (
    pathname === LEGACY_EXECUTIVE_SCORECARD_PATH
    || pathname.startsWith(`${LEGACY_EXECUTIVE_SCORECARD_PATH}/`)
  );
}
