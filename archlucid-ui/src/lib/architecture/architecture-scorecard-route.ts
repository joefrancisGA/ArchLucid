/** Canonical Architecture scorecard (left-nav label); formerly `/scorecard` and `/sponsor-report/architecture-scorecard` (retired — no redirect). */
export const ARCHITECTURE_SCORECARD_PATH = "/insights/architecture-scorecard" as const;

/** Retired flat bookmark — no App Router page and no next.config redirect. */
export const LEGACY_SCORECARD_PATH = "/scorecard" as const;

/** Retired sponsor-report nested path — no App Router page and no next.config redirect. */
export const LEGACY_SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH =
  "/sponsor-report/architecture-scorecard" as const;

export function isArchitectureScorecardPath(pathname: string): boolean {
  return (
    pathname === ARCHITECTURE_SCORECARD_PATH
    || pathname.startsWith(`${ARCHITECTURE_SCORECARD_PATH}/`)
  );
}
