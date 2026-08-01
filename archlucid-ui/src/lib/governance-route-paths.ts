/** Canonical governance nav URLs (TB-405). */
export const GOVERNANCE_POLICY_PACKS_PATH = "/governance/policy-packs";

export const GOVERNANCE_RESOLUTION_PATH = "/governance/resolution";

export const GOVERNANCE_AUDIT_PATH = "/governance/audit";

export const GOVERNANCE_ALERTS_PATH = "/governance/alerts";

export const GOVERNANCE_ALERT_RULES_PATH = "/governance/alert-rules";

/** Legacy browser paths — permanent redirects to canonical (TB-405). */
export const LEGACY_POLICY_PACKS_PATH = "/policy-packs";

export const LEGACY_GOVERNANCE_RESOLUTION_PATH = "/governance-resolution";

export const LEGACY_AUDIT_PATH = "/audit";

export const LEGACY_ALERTS_PATH = "/alerts";

/** Retired pre-release path — no redirect; use alert-rules Routing tab. */
export const LEGACY_ALERT_ROUTING_PATH = "/alert-routing";

export function pathMatchesRoutePrefix(pathname: string, prefix: string): boolean {
  if (prefix === "/") {
    return pathname === "/";
  }

  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function pathMatchesGovernancePolicyPacks(pathname: string): boolean {
  return (
    pathMatchesRoutePrefix(pathname, GOVERNANCE_POLICY_PACKS_PATH)
    || pathMatchesRoutePrefix(pathname, LEGACY_POLICY_PACKS_PATH)
  );
}

export function pathMatchesGovernanceResolution(pathname: string): boolean {
  return (
    pathMatchesRoutePrefix(pathname, GOVERNANCE_RESOLUTION_PATH)
    || pathMatchesRoutePrefix(pathname, LEGACY_GOVERNANCE_RESOLUTION_PATH)
  );
}

export function pathMatchesGovernanceAudit(pathname: string): boolean {
  return (
    pathMatchesRoutePrefix(pathname, GOVERNANCE_AUDIT_PATH)
    || pathMatchesRoutePrefix(pathname, LEGACY_AUDIT_PATH)
  );
}

export function pathMatchesGovernanceAlerts(pathname: string): boolean {
  return (
    pathMatchesRoutePrefix(pathname, GOVERNANCE_ALERTS_PATH)
    || pathMatchesRoutePrefix(pathname, LEGACY_ALERTS_PATH)
  );
}

export function pathMatchesGovernanceAlertRules(pathname: string): boolean {
  return pathMatchesRoutePrefix(pathname, GOVERNANCE_ALERT_RULES_PATH);
}

export function governancePolicyPackDetailPath(policyPackId: string): string {
  return `${GOVERNANCE_POLICY_PACKS_PATH}/${encodeURIComponent(policyPackId.trim())}`;
}

export function governanceAlertRulesTabHref(tab: string): string {
  const trimmed = tab.trim();

  if (trimmed.length === 0 || trimmed === "rules") {
    return GOVERNANCE_ALERT_RULES_PATH;
  }

  const params = new URLSearchParams();
  params.set("tab", trimmed);

  return `${GOVERNANCE_ALERT_RULES_PATH}?${params.toString()}`;
}

/** Legacy deep links on the Alerts inbox URL — prefer {@link governanceAlertRulesTabHref}. */
export function governanceAlertsTabHref(tab: string): string {
  const trimmed = tab.trim();

  if (trimmed.length === 0 || trimmed === "inbox") {
    return GOVERNANCE_ALERTS_PATH;
  }

  return governanceAlertRulesTabHref(trimmed);
}
