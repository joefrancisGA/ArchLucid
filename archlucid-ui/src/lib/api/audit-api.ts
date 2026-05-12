import {
  apiGet,
  ensureOidcBearerReady,
  resolveBinaryGetRequest,
  throwApiRequestError,
  withCorrelationHeaders,
} from "./http";

export interface CursorPagedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  requestedTake: number;
}

/** Row from `GET /v1/audit` / `GET /v1/audit/search` items (camelCase JSON). */

export interface AuditEvent {
  eventId: string;
  occurredUtc: string;
  eventType: string;
  actorUserId: string;
  actorUserName: string;
  tenantId: string;
  workspaceId: string;
  projectId: string;
  runId: string | null;
  manifestId: string | null;
  artifactId: string | null;
  dataJson: string;
  correlationId: string | null;
  otelTraceId?: string | null;
}

/** Filtered audit query for the operator UI (returns a cursor page). */
export async function searchAuditEvents(params: {
  /** Pass `nextCursor` from the prior page response. */
  cursor?: string;
  eventType?: string;
  fromUtc?: string;
  toUtc?: string;
  /** Explicit keyset — prefer `cursor` for load-more when supported. */
  beforeUtc?: string;
  /** Tie-break when many events share the same `occurredUtc` (matches API `beforeEventId`). */
  beforeEventId?: string;
  correlationId?: string;
  actorUserId?: string;
  runId?: string;
  take?: number;
}): Promise<CursorPagedResponse<AuditEvent>> {
  const query = new URLSearchParams();
  if (params.cursor) query.set("cursor", params.cursor);
  if (params.eventType) query.set("eventType", params.eventType);
  if (params.fromUtc) query.set("fromUtc", params.fromUtc);
  if (params.toUtc) query.set("toUtc", params.toUtc);
  if (params.beforeUtc) query.set("beforeUtc", params.beforeUtc);
  if (params.beforeEventId) query.set("beforeEventId", params.beforeEventId);
  if (params.correlationId) query.set("correlationId", params.correlationId);
  if (params.actorUserId) query.set("actorUserId", params.actorUserId);
  if (params.runId) query.set("runId", params.runId);
  if (params.take) query.set("take", String(params.take));
  const qs = query.toString();
  return apiGet<CursorPagedResponse<AuditEvent>>(`/v1/audit/search${qs ? `?${qs}` : ""}`);
}

/** Core registry constants for event-type dropdowns (`GET /v1/audit/event-types`). */
export async function getAuditEventTypes(): Promise<string[]> {
  return apiGet<string[]>("/v1/audit/event-types");
}

/**
 * Downloads `GET /v1/audit/export` as CSV (browser only). Requires UTC instants acceptable to the API.
 * Optional filters match `GET /v1/audit/search`.
 */
export async function downloadAuditExportCsv(params: {
  fromUtcIso: string;
  toUtcIso: string;
  maxRows?: number;
  eventType?: string;
  correlationId?: string;
  actorUserId?: string;
  runId?: string;
}): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("downloadAuditExportCsv is only available in the browser.");
  }

  const query = new URLSearchParams();
  query.set("fromUtc", params.fromUtcIso);
  query.set("toUtc", params.toUtcIso);
  if (params.eventType !== undefined && params.eventType.length > 0) {
    query.set("eventType", params.eventType);
  }

  if (params.correlationId !== undefined && params.correlationId.length > 0) {
    query.set("correlationId", params.correlationId);
  }

  if (params.actorUserId !== undefined && params.actorUserId.length > 0) {
    query.set("actorUserId", params.actorUserId);
  }

  if (params.runId !== undefined && params.runId.length > 0) {
    query.set("runId", params.runId);
  }

  if (params.maxRows !== undefined) {
    query.set("maxRows", String(params.maxRows));
  }

  await ensureOidcBearerReady();
  const { url, headers } = resolveBinaryGetRequest(`/v1/audit/export?${query.toString()}`);
  const h = withCorrelationHeaders(new Headers(headers));
  h.set("Accept", "text/csv");
  const response = await fetch(url, { cache: "no-store", headers: h });
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text);
  }

  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const disposition = response.headers.get("Content-Disposition");
  let filename = "audit-export.csv";

  if (disposition) {
    const m = /filename="?([^";]+)"?/i.exec(disposition);

    if (m?.[1]) {
      filename = m[1].trim();
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
