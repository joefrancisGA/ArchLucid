import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
  SECURENOW_INFRASTRUCTURE_DRIFT_LEGACY_PATH,
  SECURENOW_INFRASTRUCTURE_DRIFT_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";

export function isDriftWorkbenchRoutePath(pathname: string | null | undefined): boolean {
  if (pathname === null || pathname === undefined) {
    return false;
  }

  const bare = pathname.split("?", 1)[0] ?? pathname;

  return bare === GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH
    || bare === SECURENOW_INFRASTRUCTURE_DRIFT_PATH
    || bare === SECURENOW_INFRASTRUCTURE_DRIFT_LEGACY_PATH;
}

/** Nav href for OperatorPageHeader — preserves Infrastructure vs Governance namespace. */
export function driftWorkbenchNavHrefForPath(pathname: string | null | undefined): string {
  const bare = pathname?.split("?", 1)[0] ?? "";

  if (bare === SECURENOW_INFRASTRUCTURE_DRIFT_PATH || bare === SECURENOW_INFRASTRUCTURE_DRIFT_LEGACY_PATH) {
    return SECURENOW_INFRASTRUCTURE_DRIFT_PATH;
  }

  if (bare === GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH) {
    return GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH;
  }

  return GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH;
}