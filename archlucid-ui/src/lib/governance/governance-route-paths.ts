/** Canonical governance nav URLs (TB-405). */

import { EXECUTIVE_DASHBOARD_WORKSPACE_HEALTH_HREF } from "@/lib/executive/executive-dashboard-route";

/** Approval queue (left-nav). Bare `/governance` is not a page and is not redirected. */
export const GOVERNANCE_APPROVAL_QUEUE_PATH = "/governance/approval-queue" as const;

/** Workspace health KPIs on the executive dashboard (merged from `/governance/dashboard`). */
export const GOVERNANCE_WORKSPACE_HEALTH_HREF = EXECUTIVE_DASHBOARD_WORKSPACE_HEALTH_HREF;

export const GOVERNANCE_POLICY_PACKS_PATH = "/governance/policy-packs";

/** Canonical Standards & rules (left-nav); formerly `/governance/resolution` (retired — no redirect). */
export const GOVERNANCE_STANDARDS_AND_RULES_PATH = "/governance/standards-and-rules" as const;

/** Alias kept for existing imports — prefer {@link GOVERNANCE_STANDARDS_AND_RULES_PATH}. */
export const GOVERNANCE_RESOLUTION_PATH = GOVERNANCE_STANDARDS_AND_RULES_PATH;

export const GOVERNANCE_AUDIT_PATH = "/governance/audit";

/** Cross-review risk-register queue (left-nav Findings). */
export const GOVERNANCE_FINDINGS_PATH = "/governance/findings" as const;

/** Personal assigned-to-me open findings queue (TB-2195). */
export const GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH = "/governance/findings/assigned-to-me" as const;

/** Cross-review decision register (left-nav). */
export const GOVERNANCE_DECISION_REGISTER_PATH = "/governance/decision-register" as const;

export const GOVERNANCE_ALERTS_PATH = "/governance/alerts";

export const GOVERNANCE_ALERT_RULES_PATH = "/governance/alert-rules";

/** Risk exceptions / waivers register (left-nav). */
export const GOVERNANCE_EXCEPTIONS_PATH = "/governance/exceptions" as const;

/** Legacy exceptions path — retired bookmark; canonical is {@link GOVERNANCE_EXCEPTIONS_PATH}. */
export const LEGACY_GOVERNANCE_RISK_EXCEPTIONS_PATH = "/governance/risk-exceptions" as const;

/** Legacy browser paths — permanent redirects to canonical (TB-405). */
export const LEGACY_POLICY_PACKS_PATH = "/policy-packs";

/** Retired flat UI bookmark — no App Router page and no next.config redirect. */
export const LEGACY_GOVERNANCE_RESOLUTION_PATH = "/governance-resolution" as const;

/** Retired nested UI path — no App Router page and no next.config redirect. */
export const LEGACY_GOVERNANCE_RESOLUTION_NESTED_PATH = "/governance/resolution" as const;

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
  return pathMatchesRoutePrefix(pathname, GOVERNANCE_STANDARDS_AND_RULES_PATH);
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

export function pathMatchesGovernanceExceptions(pathname: string): boolean {
  return (
    pathMatchesRoutePrefix(pathname, GOVERNANCE_EXCEPTIONS_PATH)
    || pathMatchesRoutePrefix(pathname, LEGACY_GOVERNANCE_RISK_EXCEPTIONS_PATH)
  );
}

/** Exact approval-queue page — not the whole `/governance/*` tree. */
export function pathMatchesGovernanceApprovalQueue(pathname: string): boolean {
  return pathname === GOVERNANCE_APPROVAL_QUEUE_PATH;
}

export function pathMatchesGovernanceAssignedToMeFindings(pathname: string): boolean {
  return pathMatchesRoutePrefix(pathname, GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH);
}

/** Approval queue href, optionally scoped to a review via `runId`. */
export function governanceApprovalQueueHref(runId?: string | null): string {
  const trimmed = runId?.trim() ?? "";

  if (trimmed.length === 0) {
    return GOVERNANCE_APPROVAL_QUEUE_PATH;
  }

  return `${GOVERNANCE_APPROVAL_QUEUE_PATH}?runId=${encodeURIComponent(trimmed)}`;
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

/**
 * Canonical alerts inbox href — strips retired `tab=inbox` while preserving inbox filters (TB-1594).
 */
export function buildCanonicalGovernanceAlertsInboxHref(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "tab" || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        params.append(key, entry);
      }
    } else {
      params.set(key, value);
    }
  }

  const query = params.toString();

  return query.length === 0 ? GOVERNANCE_ALERTS_PATH : `${GOVERNANCE_ALERTS_PATH}?${query}`;
}
