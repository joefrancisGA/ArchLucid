import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { applyCorrelationHeaders } from "@/lib/api/http";
import {
  parseFilenameFromContentDisposition,
  triggerBrowserBlobDownload,
} from "./downloads-blob-trigger-browser";
import {
  apiGet,
  ensureOidcBearerReady,
  resolveBinaryGetRequest,
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
  const { url, headers } = await resolveBinaryGetRequest(`/v1/audit/export?${query.toString()}`);
  const requestHeaders = withCorrelationHeaders(new Headers(headers));
  requestHeaders.set("Accept", "text/csv");
  const { headers: correlatedHeaders, correlationId } = applyCorrelationHeaders(requestHeaders);
  const response = await fetch(url, { cache: "no-store", headers: correlatedHeaders });
  const text = await response.text();

  if (!response.ok) {
    const failure = toApiLoadFailure(buildApiRequestErrorFromParts(response, text, correlationId));
    throw new Error(formatExportSealedManifestAwareApiError(failure));
  }

  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const filename =
    parseFilenameFromContentDisposition(response.headers.get("Content-Disposition")) ?? "audit-export.csv";

  await triggerBrowserBlobDownload(blob, filename);
}
