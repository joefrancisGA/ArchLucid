import {
  GOVERNANCE_AUDIT_PATH,
  LEGACY_AUDIT_PATH,
  pathMatchesGovernanceAudit,
} from "@/lib/governance-route-paths";

const AUDIT_NAV_PATHS = new Set<string>([GOVERNANCE_AUDIT_PATH, LEGACY_AUDIT_PATH]);

/** True when a nav href targets the audit trail surface (ignores query string). */
export function isAuditNavPath(pathname: string): boolean {
  const normalized = (pathname.split("?")[0] ?? "").trim() || "/";

  return AUDIT_NAV_PATHS.has(normalized);
}

/** Canonical scoped audit trail URL; unscoped when no review id is known. */
export function auditTrailNavHref(runId: string | null | undefined): string {
  const trimmed = runId?.trim() ?? "";

  if (trimmed.length === 0) {
    return GOVERNANCE_AUDIT_PATH;
  }

  const params = new URLSearchParams();
  params.set("runId", trimmed);

  return `${GOVERNANCE_AUDIT_PATH}?${params.toString()}`;
}

export function pathMatchesAuditTrail(pathname: string): boolean {
  return pathMatchesGovernanceAudit(pathname);
}
