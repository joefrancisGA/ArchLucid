export type RunScopedAuditExportParams = {
  readonly fromUtcIso: string;
  readonly toUtcIso: string;
  readonly maxRows: number;
  readonly runId: string;
};

/** Builds a wide UTC window for run-scoped audit CSV export (`GET /v1/audit/export?runId=…`). */
export function buildRunScopedAuditExportParams(runId: string): RunScopedAuditExportParams {
  const trimmedRunId = runId.trim();
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
