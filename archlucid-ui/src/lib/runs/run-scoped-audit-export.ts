export const RUN_SCOPED_AUDIT_EXPORT_SCOPE_HELPER =
  "Exports the last five years of audit events, up to 10,000 rows — not the full stored trail." as const;

export type RunScopedAuditExportParams = {
  readonly fromUtcIso: string;
  readonly toUtcIso: string;
  readonly maxRows: number;
  readonly runId: string;
};

/** Builds a wide UTC window for run-scoped audit CSV export (`GET /v1/audit/export?runId=…`). */
export function buildRunScopedAuditExportParams(runId: string): RunScopedAuditExportParams {
  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    throw new Error("Run id was not stored.");
  }
  const toUtc = new Date();
  const fromUtc = new Date(toUtc);

  fromUtc.setUTCFullYear(fromUtc.getUTCFullYear() - 5);

  return {
    fromUtcIso: fromUtc.toISOString(),
    toUtcIso: toUtc.toISOString(),
    maxRows: 10_000,
    runId: trimmedRunId,
  };
}
