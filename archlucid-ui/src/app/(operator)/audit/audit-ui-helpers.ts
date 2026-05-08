/** Pure helpers for the operator audit page (Vitest-friendly). */

export function formatAuditSummaryHeading(count: number, hasMore: boolean): string {
  if (count === 0) {
    return "Showing 0 events";
  }

  const suffix = hasMore ? "+" : "";

  return `Showing ${count}${suffix} event${count === 1 ? "" : "s"}`;
}

export function canExportAuditCsv(fromUtc: string, toUtc: string): boolean {
  return fromUtc.trim().length > 0 && toUtc.trim().length > 0;
}

/**
 * Mirrors **`ArchLucidPolicies.RequireAuditor`** on `AuditController.ExportAudit` — Auditor or Admin app role only.
 * Operator without Auditor still fails export at the API; keep the button soft-disabled for consistent UX.
 */
export function principalRolesAllowAuditCsvExport(roleClaimValues: ReadonlyArray<string>): boolean {
  for (const raw of roleClaimValues) {
    const normalized = raw.trim().toLowerCase();

    if (normalized.length === 0) {
      continue;
    }

    if (normalized === "auditor" || normalized === "admin") {
      return true;
    }
  }

  return false;
}

/**
 * Stable lifecycle ordering for audit / pipeline milestone cards (buyer timeline + demo samples).
 */
export function auditEventLifecycleSortKey(eventType: string): number {
  const table: Record<string, number> = {
    RunStarted: 0,
    "context.snapshot.created": 10,
    "graph.snapshot.created": 20,
    "findings.snapshot.created": 30,
    "finalize.run": 40,
    "artifact.bundle.created": 50,
  };

  const key = eventType.trim();
  const rank = table[key];

  if (rank !== undefined) {
    return rank;
  }

  return 1000;
}
