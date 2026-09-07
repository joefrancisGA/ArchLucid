/** Platform operational error row from GET /v1/admin/operational-errors. */
export type OperationalErrorRow = {
  id: string;
  occurredUtc: string;
  source: string;
  category: string;
  httpStatusCode: number | null;
  httpMethod: string | null;
  requestPath: string | null;
  problemType: string | null;
  exceptionType: string | null;
  message: string;
  stackTrace: string | null;
  sqlErrorNumber: number | null;
  sqlErrorState: number | null;
  correlationId: string | null;
  otelTraceId: string | null;
  tenantId: string | null;
  workspaceId: string | null;
  projectId: string | null;
  actorUserId: string | null;
  detailJson: string;
};

export function truncateOperationalErrorMessage(message: string, maxLength = 120): string {
  const trimmed = message.trim();

  if (trimmed.length <= maxLength)
    return trimmed;

  return `${trimmed.slice(0, maxLength - 1)}…`;
}

export function formatOperationalErrorUtc(isoUtc: string): string {
  const parsed = Date.parse(isoUtc);

  if (Number.isNaN(parsed))
    return isoUtc;

  return new Date(parsed).toISOString().replace("T", " ").replace(".000Z", " UTC");
}

function escapeOperationalErrorClipboardCell(value: string): string {
  const normalized = value.replace(/\r\n/g, "\n").trim();

  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

function operationalErrorClipboardCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  return escapeOperationalErrorClipboardCell(String(value));
}

/** Tabular clipboard export for the filtered operational-errors list (CSV, header row included). */
export function buildOperationalErrorsTableClipboardText(rows: readonly OperationalErrorRow[]): string {
  const header = [
    "Occurred (UTC)",
    "Category",
    "Status",
    "Path",
    "Message",
    "Correlation",
    "Tenant",
  ];

  const lines = rows.map((row) =>
    [
      formatOperationalErrorUtc(row.occurredUtc),
      row.category,
      row.httpStatusCode,
      row.requestPath,
      row.message,
      row.correlationId,
      row.tenantId,
    ]
      .map(operationalErrorClipboardCell)
      .join(","),
  );

  return [header.join(","), ...lines].join("\n");
}

export function rowMatchesOperationalErrorFilters(
  row: OperationalErrorRow,
  categoryFilter: string,
  statusFilter: string,
  tenantFilter: string,
  correlationFilter: string,
): boolean {
  if (categoryFilter !== "all" && row.category !== categoryFilter)
    return false;

  if (statusFilter !== "all") {
    const minStatus = Number.parseInt(statusFilter, 10);

    if (!Number.isNaN(minStatus) && (row.httpStatusCode ?? 0) < minStatus)
      return false;
  }

  if (tenantFilter.trim().length > 0) {
    const needle = tenantFilter.trim().toLowerCase();
    const tenant = (row.tenantId ?? "").toLowerCase();

    if (!tenant.includes(needle))
      return false;
  }

  if (correlationFilter.trim().length > 0) {
    const needle = correlationFilter.trim().toLowerCase();
    const correlation = (row.correlationId ?? "").toLowerCase();

    if (!correlation.includes(needle))
      return false;
  }

  return true;
}
