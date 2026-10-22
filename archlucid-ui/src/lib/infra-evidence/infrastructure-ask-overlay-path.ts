import {
  GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
  GOVERNANCE_INFRASTRUCTURE_PATH,
  SECURENOW_INFRASTRUCTURE_ASK_PATH,
  SECURENOW_INFRASTRUCTURE_PATH,
  isGovernanceInfrastructureAskRoutePath,
  isGovernanceInfrastructureRoutePath,
} from "@/lib/governance/governance-infrastructure-route-paths";

/** True when Infrastructure Ask should open as a drawer on the current route instead of navigating away. */
export function isInfrastructureAskOverlayEligiblePath(pathname: string | null | undefined): boolean {
  if (!isGovernanceInfrastructureRoutePath(pathname)) {
    return false;
  }

  if (isGovernanceInfrastructureAskRoutePath(pathname)) {
    return false;
  }

  const bare = (pathname ?? "").split("?", 1)[0] ?? "";

  if (bare === GOVERNANCE_INFRASTRUCTURE_PATH || bare === SECURENOW_INFRASTRUCTURE_PATH) {
    return false;
  }

  return true;
}

export function isInfrastructureAskNavHref(href: string): boolean {
  const bare = href.split("?", 1)[0] ?? href;

  return bare === GOVERNANCE_INFRASTRUCTURE_ASK_PATH || bare === SECURENOW_INFRASTRUCTURE_ASK_PATH;
}
