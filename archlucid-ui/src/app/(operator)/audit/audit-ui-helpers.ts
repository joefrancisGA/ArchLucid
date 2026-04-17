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
